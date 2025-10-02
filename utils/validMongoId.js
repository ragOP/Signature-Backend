const mongoose = require("mongoose");

/**
 * Helper function to validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper function to validate multiple MongoDB ObjectIds
 * @param {Array} ids - Array of IDs to validate
 * @returns {Object} - { isValid: boolean, invalidIds: Array }
 */
const validateObjectIds = (ids) => {
  if (!Array.isArray(ids)) {
    return { isValid: false, invalidIds: [] };
  }

  const invalidIds = ids.filter((id) => !isValidObjectId(id));
  return {
    isValid: invalidIds.length === 0,
    invalidIds,
  };
};

module.exports = { isValidObjectId, validateObjectIds };
