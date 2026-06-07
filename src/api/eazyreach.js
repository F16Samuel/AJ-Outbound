const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Stage 3: Resolving LinkedIn Profile to Verified Email
 * Uses Prospeo Enrich Person API (via EAZYREACH_API_KEY) to retrieve a verified work email from a LinkedIn URL.
 * 
 * @param {string} linkedinUrl - The LinkedIn profile URL of the contact.
 * @returns {Promise<string|null>} The verified email address, or null if not found.
 */
async function resolveEmail(linkedinUrl) {
  const apiKey = process.env.EAZYREACH_API_KEY;

  if (!apiKey) {
    throw new Error('EAZYREACH_API_KEY is not defined in the environment variables.');
  }

  logger.info(`Eazyreach Fallback: Resolving email for LinkedIn profile: ${linkedinUrl}`);

  try {
    const response = await axios.post('https://api.prospeo.io/enrich-person', {
      only_verified_email: true,
      enrich_mobile: false,
      data: {
        linkedin_url: linkedinUrl
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': apiKey
      }
    });

    const emailInfo = response.data.response?.email;
    if (emailInfo && emailInfo.email) {
      const email = emailInfo.email;
      const verdict = emailInfo.verdict || 'unknown';
      
      if (verdict === 'verified' || verdict === 'catch-all' || verdict === 'safe') {
        logger.success(`Successfully resolved email: ${email} (Verdict: ${verdict})`);
        return email;
      } else {
        logger.warn(`Resolved email ${email} but verdict was: ${verdict}. Skipping to maintain high deliverability.`);
        return null;
      }
    } else {
      logger.warn(`No email found for LinkedIn profile: ${linkedinUrl}`);
      return null;
    }

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    logger.error(`Error resolving email for ${linkedinUrl}: ${errorMsg}`);
    // Return null to keep orchestrator running rather than crashing
    return null;
  }
}

module.exports = { resolveEmail };
