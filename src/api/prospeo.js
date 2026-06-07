const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Stage 2: Finding Decision Makers at a Company Domain
 * Uses Prospeo Search Person API to find C-suite, VP, and Director level employees and their LinkedIn URLs.
 * 
 * @param {string} domain - The company domain to search (e.g. 'stripe.com').
 * @returns {Promise<Array<{firstName: string, lastName: string, jobTitle: string, linkedinUrl: string, companyName: string, domain: string}>>} List of decision makers.
 */
async function getDecisionMakers(domain) {
  const apiKey = process.env.PROSPEO_API_KEY;

  if (!apiKey) {
    throw new Error('PROSPEO_API_KEY is not defined in the environment variables.');
  }

  const cleanDomain = domain
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .toLowerCase();

  logger.info(`Searching Prospeo for decision-makers at: ${cleanDomain}`);

  try {
    const response = await axios.post('https://api.prospeo.io/search-person', {
      filters: {
        person_search: cleanDomain,
        person_seniority: {
          include: ['C-Suite', 'Vice President', 'Director']
        }
      },
      page: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': apiKey
      }
    });

    const results = response.data.response?.results || [];
    const decisionMakers = [];

    for (const lead of results) {
      if (!lead.linkedin) continue; // LinkedIn URL is required for Stage 3

      // Normalize names and titles
      const firstName = lead.first_name || '';
      const lastName = lead.last_name || '';
      const jobTitle = lead.job_title || lead.title || 'Executive';
      const linkedinUrl = lead.linkedin;
      const companyName = lead.company?.name || cleanDomain.split('.')[0];

      decisionMakers.push({
        firstName,
        lastName,
        jobTitle,
        linkedinUrl,
        companyName,
        domain: cleanDomain
      });
    }

    logger.success(`Stage 2: Found ${decisionMakers.length} decision-makers for ${cleanDomain}`);
    decisionMakers.forEach((dm, i) => {
      console.log(`   - ${dm.firstName} ${dm.lastName} (${dm.jobTitle}) - ${dm.linkedinUrl}`);
    });

    return decisionMakers;

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    logger.error(`Error querying Prospeo for domain ${cleanDomain}: ${errorMsg}`);
    // Return empty array to keep orchestrator running rather than crashing the script
    return [];
  }
}

module.exports = { getDecisionMakers };
