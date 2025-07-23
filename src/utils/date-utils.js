const moment = require('moment');

/**
 * Date utility functions for the Amazon Reports application
 */
class DateUtils {
  /**
   * Get a date range object with start and end dates
   * @param {string} period - The period (today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear, custom)
   * @param {string} startDate - Optional start date for custom period (YYYY-MM-DD)
   * @param {string} endDate - Optional end date for custom period (YYYY-MM-DD)
   * @returns {Object} - Object containing startDate and endDate
   */
  static getDateRange(period, startDate, endDate) {
    const today = moment().format('YYYY-MM-DD');
    
    switch (period) {
      case 'today':
        return {
          startDate: today,
          endDate: today
        };
      case 'yesterday':
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
        return {
          startDate: yesterday,
          endDate: yesterday
        };
      case 'last7days':
        return {
          startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: today
        };
      case 'last30days':
        return {
          startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
          endDate: today
        };
      case 'thisMonth':
        return {
          startDate: moment().startOf('month').format('YYYY-MM-DD'),
          endDate: today
        };
      case 'lastMonth':
        return {
          startDate: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
          endDate: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        };
      case 'thisYear':
        return {
          startDate: moment().startOf('year').format('YYYY-MM-DD'),
          endDate: today
        };
      case 'custom':
        // Validate custom dates
        if (!startDate || !endDate) {
          throw new Error('Start date and end date are required for custom period');
        }
        
        if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
          throw new Error('Invalid date format. Use YYYY-MM-DD');
        }
        
        return {
          startDate,
          endDate
        };
      default:
        // Default to last 30 days
        return {
          startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
          endDate: today
        };
    }
  }

  /**
   * Format a date in a readable format
   * @param {string} dateString - The date string to format
   * @param {string} format - The output format (default: 'MMMM DD, YYYY')
   * @returns {string} - Formatted date string
   */
  static formatDate(dateString, format = 'MMMM DD, YYYY') {
    return moment(dateString).format(format);
  }

  /**
   * Get an array of dates between start and end date
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} - Array of date strings
   */
  static getDatesBetween(startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    const dates = [];
    
    let current = start.clone();
    
    while (current.isSameOrBefore(end)) {
      dates.push(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }
    
    return dates;
  }

  /**
   * Group data by date
   * @param {Array} data - Array of objects with date property
   * @param {string} dateField - The field containing the date
   * @param {string} dateFormat - The format of the date (default: 'YYYY-MM-DD')
   * @returns {Object} - Object with dates as keys and arrays as values
   */
  static groupByDate(data, dateField, dateFormat = 'YYYY-MM-DD') {
    return data.reduce((acc, item) => {
      const date = moment(item[dateField]).format(dateFormat);
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push(item);
      return acc;
    }, {});
  }

  /**
   * Check if a date is within a range
   * @param {string} date - The date to check
   * @param {string} startDate - Start date of the range
   * @param {string} endDate - End date of the range
   * @returns {boolean} - True if date is within range
   */
  static isDateInRange(date, startDate, endDate) {
    const checkDate = moment(date);
    return checkDate.isSameOrAfter(startDate) && checkDate.isSameOrBefore(endDate);
  }
}

module.exports = DateUtils;
