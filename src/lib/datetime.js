import dayjs from 'dayjs';

import dateTimeConstants from '@/consts/datetime.js';
import { isObject, isString, isNumber } from './common.js';

export function isYearMonthValid(year, month) {
    if (!isNumber(year) || !isNumber(month)) {
        return false;
    }

    return year > 0 && month >= 0 && month <= 11;
}

export function getYearMonthObjectFromString(yearMonth) {
    if (!isString(yearMonth)) {
        return null;
    }

    const items = yearMonth.split('-');

    if (items.length !== 2) {
        return null;
    }

    const year = parseInt(items[0]);
    const month = parseInt(items[1]) - 1;

    if (!isYearMonthValid(year, month)) {
        return null;
    }

    return {
        year: year,
        month: month
    };
}

export function getYearMonthStringFromObject(yearMonth) {
    if (!yearMonth || !isYearMonthValid(yearMonth.year, yearMonth.month)) {
        return '';
    }

    return `${yearMonth.year}-${yearMonth.month + 1}`;
}

export function getTwoDigitsString(value) {
    if (value < 10) {
        return '0' + value;
    } else {
        return value.toString();
    }
}

export function getHourIn12HourFormat(hour) {
    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return hour;
}

export function isPM(hour) {
    if (hour > 11) {
        return true;
    } else {
        return false;
    }
}

export function getUtcOffsetMinutesByUtcOffset(utcOffset) {
    if (!utcOffset) {
        return 0;
    }

    const parts = utcOffset.split(':');

    if (parts.length !== 2) {
        return 0;
    }

    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

export function getUtcOffsetByUtcOffsetMinutes(utcOffsetMinutes) {
    let offsetHours = parseInt(Math.abs(utcOffsetMinutes) / 60);
    let offsetMinutes = Math.abs(utcOffsetMinutes) - offsetHours * 60;

    if (offsetHours < 10) {
        offsetHours = '0' + offsetHours;
    }

    if (offsetMinutes < 10) {
        offsetMinutes = '0' + offsetMinutes;
    }

    if (utcOffsetMinutes >= 0) {
        return `+${offsetHours}:${offsetMinutes}`;
    } else if (utcOffsetMinutes < 0) {
        return `-${offsetHours}:${offsetMinutes}`;
    }
}

export function getTimezoneOffset(timezone) {
    if (timezone) {
        return dayjs().tz(timezone).format('Z');
    } else {
        return dayjs().format('Z');
    }
}

export function getTimezoneOffsetMinutes(timezone) {
    const utcOffset = getTimezoneOffset(timezone);
    return getUtcOffsetMinutesByUtcOffset(utcOffset);
}

export function getBrowserTimezoneOffset() {
    return getUtcOffsetByUtcOffsetMinutes(getBrowserTimezoneOffsetMinutes());
}

export function getBrowserTimezoneOffsetMinutes() {
    return -new Date().getTimezoneOffset();
}

export function getLocalDatetimeFromUnixTime(unixTime) {
    return new Date(unixTime * 1000);
}

export function getUnixTimeFromLocalDatetime(datetime) {
    return datetime.getTime() / 1000;
}

export function getActualUnixTimeForStore(unixTime, utcOffset, currentUtcOffset) {
    return unixTime - (utcOffset - currentUtcOffset) * 60;
}

export function getDummyUnixTimeForLocalUsage(unixTime, utcOffset, currentUtcOffset) {
    return unixTime + (utcOffset - currentUtcOffset) * 60;
}

export function getCurrentUnixTime() {
    return dayjs().unix();
}

export function getUnixTimeAddYears(currentUnix, year) {
    const currentTime = dayjs.unix(currentUnix);
    const timeAfter3Years = currentTime.add(year, 'year');
    return timeAfter3Years.unix();
}

export function getCurrentDateTime() {
    return dayjs();
}

export function parseDateFromUnixTime(unixTime, utcOffset, currentUtcOffset) {
    if (isNumber(utcOffset)) {
        if (!isNumber(currentUtcOffset)) {
            currentUtcOffset = getTimezoneOffsetMinutes();
        }

        unixTime = getDummyUnixTimeForLocalUsage(unixTime, utcOffset, currentUtcOffset);
    }

    return dayjs.unix(unixTime);
}

export function formatUnixTime(unixTime, format, utcOffset, currentUtcOffset) {
    return parseDateFromUnixTime(unixTime, utcOffset, currentUtcOffset).format(format);
}

export function formatTime(dateTime, format) {
    return dayjs(dateTime).format(format);
}

export function getUnixTime(date) {
    return dayjs(date).unix();
}

export function getShortDate(date) {
    date = dayjs(date);
    return date.year() + '-' + (date.month() + 1) + '-' + date.date();
}

export function getYear(date) {
    return dayjs(date).year();
}

export function getMonth(date) {
    return dayjs(date).month() + 1;
}

export function getYearAndMonth(date) {
    const year = getYear(date);
    let month = getMonth(date);

    if (month < 10) {
        month = '0' + month;
    }

    return `${year}-${month}`;
}

export function getYearAndMonthFromUnixTime(unixTime) {
    if (!unixTime) {
        return '';
    }

    return getYearAndMonth(parseDateFromUnixTime(unixTime));
}

export function getDay(date) {
    return dayjs(date).date();
}

export function getDayOfWeekName(date) {
    const dayOfWeek = dayjs(date).day();
    return dateTimeConstants.allWeekDaysArray[dayOfWeek].name;
  }

export function getMonthName(date) {
    const dayOfWeek = dayjs(date).month();
    return dateTimeConstants.allMonthsArray[dayOfWeek];
}

export function getAMOrPM(hour) {
    return isPM(hour) ? dateTimeConstants.allMeridiemIndicators.PM : dateTimeConstants.allMeridiemIndicators.AM;
}

export function getHour(date) {
    return dayjs(date).hour();
}

export function getMinute(date) {
    return dayjs(date).minute();
}

export function getSecond(date) {
    return dayjs(date).second();
}

export function getUnixTimeBeforeUnixTime(unixTime, amount, unit) {
    return dayjs.unix(unixTime).subtract(amount, unit).unix();
}

export function getUnixTimeAfterUnixTime(unixTime, amount, unit) {
    return dayjs.unix(unixTime).add(amount, unit).unix();
}

export function getTimeDifferenceHoursAndMinutes(timeDifferenceInMinutes) {
    let offsetHours = parseInt(Math.abs(timeDifferenceInMinutes) / 60);
    let offsetMinutes = Math.abs(timeDifferenceInMinutes) - offsetHours * 60;

    return {
        offsetHours: offsetHours,
        offsetMinutes: offsetMinutes,
    };
}

export function getMinuteFirstUnixTime(date) {
    const datetime = dayjs(date);
    return datetime.set({ second: 0, millisecond: 0 }).unix();
}

export function getMinuteLastUnixTime(date) {
    return dayjs.unix(getMinuteFirstUnixTime(date)).add(1, 'minutes').subtract(1, 'seconds').unix();
}

export function getTodayFirstUnixTime() {
    return dayjs().startOf('day').unix();
  }

export function getTodayLastUnixTime() {
    return dayjs.unix(getTodayFirstUnixTime()).add(1, 'days').subtract(1, 'seconds').unix();
}

export function getThisWeekFirstUnixTime(firstDayOfWeek) {
    const today = dayjs.unix(getTodayFirstUnixTime());

    if (!isNumber(firstDayOfWeek)) {
        firstDayOfWeek = 0;
    }

    let dayOfWeek = today.day() - firstDayOfWeek;

    if (dayOfWeek < 0) {
        dayOfWeek += 7;
    }

    return today.subtract(dayOfWeek, 'days').unix();
}

export function getThisWeekLastUnixTime(firstDayOfWeek) {
    return dayjs.unix(getThisWeekFirstUnixTime(firstDayOfWeek)).add(7, 'days').subtract(1, 'seconds').unix();
}

export function getThisMonthFirstUnixTime() {
    const today = dayjs.unix(getTodayFirstUnixTime());
    return today.subtract(today.date() - 1, 'days').unix();
}

export function getThisMonthLastUnixTime() {
    return dayjs.unix(getThisMonthFirstUnixTime()).add(1, 'months').subtract(1, 'seconds').unix();
}

export function getThisYearFirstUnixTime() {
    const today = dayjs.unix(getTodayFirstUnixTime());
    return today.startOf('year').unix();
}

export function getThisYearLastUnixTime() {
    return dayjs.unix(getThisYearFirstUnixTime()).add(1, 'years').subtract(1, 'seconds').unix();
}

export function getSpecifiedDayFirstUnixTime(unixTime) {
    return dayjs.unix(unixTime).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).unix();
}

export function getYearMonthFirstUnixTime(yearMonth) {
    if (isString(yearMonth)) {
        yearMonth = getYearMonthObjectFromString(yearMonth);
    } else if (isObject(yearMonth) && !isYearMonthValid(yearMonth.year, yearMonth.month)) {
        yearMonth = null;
    }

    if (!yearMonth) {
        return 0;
    }

    return moment().set({ year: yearMonth.year, month: yearMonth.month, date: 1, hour: 0, minute: 0, second: 0, millisecond: 0 }).unix();
}

export function getYearMonthLastUnixTime(yearMonth) {
    return moment.unix(getYearMonthFirstUnixTime(yearMonth)).add(1, 'months').subtract(1, 'seconds').unix();
}

export function getDateTimeFormatType(allFormatMap, allFormatArray, localeDefaultFormatTypeName, systemDefaultFormatType, formatTypeValue) {
    if (formatTypeValue > dateTimeConstants.defaultDateTimeFormatValue && allFormatArray[formatTypeValue - 1] && allFormatArray[formatTypeValue - 1].key) {
        return allFormatArray[formatTypeValue - 1];
    } else if (formatTypeValue === dateTimeConstants.defaultDateTimeFormatValue && allFormatMap[localeDefaultFormatTypeName] && allFormatMap[localeDefaultFormatTypeName].key) {
        return allFormatMap[localeDefaultFormatTypeName];
    } else {
        return systemDefaultFormatType;
    }
}

export function getShiftedDateRange(minTime, maxTime, scale) {
    const minDateTime = parseDateFromUnixTime(minTime).set({ second: 0, millisecond: 0 });
    const maxDateTime = parseDateFromUnixTime(maxTime).set({ second: 59, millisecond: 999 });

    const firstDayOfMonth = minDateTime.clone().startOf('month');
    const lastDayOfMonth = maxDateTime.clone().endOf('month');

    if (firstDayOfMonth.unix() === minDateTime.unix() && lastDayOfMonth.unix() === maxDateTime.unix()) {
        const months = getYear(maxDateTime) * 12 + getMonth(maxDateTime) - getYear(minDateTime) * 12 - getMonth(minDateTime) + 1;
        const newMinDateTime = minDateTime.add(months * scale, 'months');
        const newMaxDateTime = newMinDateTime.clone().add(months, 'months').subtract(1, 'seconds');

        return {
            minTime: newMinDateTime.unix(),
            maxTime: newMaxDateTime.unix()
        };
    }

    const range = (maxTime - minTime + 1) * scale;

    return {
        minTime: minTime + range,
        maxTime: maxTime + range
    };
}

export function getShiftedDateRangeAndDateType(minTime, maxTime, scale, firstDayOfWeek, scene) {
    const newDateRange = getShiftedDateRange(minTime, maxTime, scale);
    const newDateType = getDateTypeByDateRange(newDateRange.minTime, newDateRange.maxTime, firstDayOfWeek, scene);

    return {
        dateType: newDateType,
        minTime: newDateRange.minTime,
        maxTime: newDateRange.maxTime
    };
}

export function getDateTypeByDateRange(minTime, maxTime, firstDayOfWeek, scene) {
    let newDateType = dateTimeConstants.allDateRanges.Custom.type;

    for (let dateRangeField in dateTimeConstants.allDateRanges) {
        if (!Object.prototype.hasOwnProperty.call(dateTimeConstants.allDateRanges, dateRangeField)) {
            continue;
        }

        const dateRangeType = dateTimeConstants.allDateRanges[dateRangeField];

        if (!dateRangeType.availableScenes[scene]) {
            continue;
        }

        const dateRange = getDateRangeByDateType(dateRangeType.type, firstDayOfWeek);

        if (dateRange && dateRange.minTime === minTime && dateRange.maxTime === maxTime) {
            newDateType = dateRangeType.type;
            break;
        }
    }

    return newDateType;
}

export function getDateRangeByDateType(dateType, firstDayOfWeek) {
    let maxTime = 0;
    let minTime = 0;

    if (dateType === dateTimeConstants.allDateRanges.All.type) { // All
        maxTime = 0;
        minTime = 0;
    } else if (dateType === dateTimeConstants.allDateRanges.Today.type) { // Today
        maxTime = getTodayLastUnixTime();
        minTime = getTodayFirstUnixTime();
    } else if (dateType === dateTimeConstants.allDateRanges.Yesterday.type) { // Yesterday
        maxTime = getUnixTimeBeforeUnixTime(getTodayLastUnixTime(), 1, 'days');
        minTime = getUnixTimeBeforeUnixTime(getTodayFirstUnixTime(), 1, 'days');
    } else if (dateType === dateTimeConstants.allDateRanges.LastSevenDays.type) { // Last 7 days
        maxTime = getTodayLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getTodayFirstUnixTime(), 6, 'days');
    } else if (dateType === dateTimeConstants.allDateRanges.LastThirtyDays.type) { // Last 30 days
        maxTime = getTodayLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getTodayFirstUnixTime(), 29, 'days');
    } else if (dateType === dateTimeConstants.allDateRanges.ThisWeek.type) { // This week
        maxTime = getThisWeekLastUnixTime(firstDayOfWeek);
        minTime = getThisWeekFirstUnixTime(firstDayOfWeek);
    } else if (dateType === dateTimeConstants.allDateRanges.LastWeek.type) { // Last week
        maxTime = getUnixTimeBeforeUnixTime(getThisWeekLastUnixTime(firstDayOfWeek), 7, 'days');
        minTime = getUnixTimeBeforeUnixTime(getThisWeekFirstUnixTime(firstDayOfWeek), 7, 'days');
    } else if (dateType === dateTimeConstants.allDateRanges.ThisMonth.type) { // This month
        maxTime = getThisMonthLastUnixTime();
        minTime = getThisMonthFirstUnixTime();
    } else if (dateType === dateTimeConstants.allDateRanges.LastMonth.type) { // Last month
        maxTime = getUnixTimeBeforeUnixTime(getThisMonthFirstUnixTime(), 1, 'seconds');
        minTime = getUnixTimeBeforeUnixTime(getThisMonthFirstUnixTime(), 1, 'months');
    } else if (dateType === dateTimeConstants.allDateRanges.ThisYear.type) { // This year
        maxTime = getThisYearLastUnixTime();
        minTime = getThisYearFirstUnixTime();
    } else if (dateType === dateTimeConstants.allDateRanges.LastYear.type) { // Last year
        maxTime = getUnixTimeBeforeUnixTime(getThisYearLastUnixTime(), 1, 'years');
        minTime = getUnixTimeBeforeUnixTime(getThisYearFirstUnixTime(), 1, 'years');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentTwelveMonths.type) { // Recent 12 months
        maxTime = getThisMonthLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisMonthFirstUnixTime(), 11, 'months');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentTwentyFourMonths.type) { // Recent 24 months
        maxTime = getThisMonthLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisMonthFirstUnixTime(), 23, 'months');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentThirtySixMonths.type) { // Recent 36 months
        maxTime = getThisMonthLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisMonthFirstUnixTime(), 35, 'months');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentTwoYears.type) { // Recent 2 years
        maxTime = getThisYearLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisYearFirstUnixTime(), 1, 'years');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentThreeYears.type) { // Recent 3 years
        maxTime = getThisYearLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisYearFirstUnixTime(), 2, 'years');
    } else if (dateType === dateTimeConstants.allDateRanges.RecentFiveYears.type) { // Recent 5 years
        maxTime = getThisYearLastUnixTime();
        minTime = getUnixTimeBeforeUnixTime(getThisYearFirstUnixTime(), 4, 'years');
    } else {
        return null;
    }

    return {
        dateType: dateType,
        maxTime: maxTime,
        minTime: minTime
    };
}

export function getRecentMonthDateRanges(monthCount) {
    const recentDateRanges = [];
    const thisMonthFirstUnixTime = getThisMonthFirstUnixTime();

    for (let i = 0; i < monthCount; i++) {
        let minTime = thisMonthFirstUnixTime;

        if (i > 0) {
            minTime = getUnixTimeBeforeUnixTime(thisMonthFirstUnixTime, i, 'months');
        }

        let maxTime = getUnixTimeBeforeUnixTime(getUnixTimeAfterUnixTime(minTime, 1, 'months'), 1, 'seconds');
        let dateType = dateTimeConstants.allDateRanges.Custom.type;
        let year = getYear(parseDateFromUnixTime(minTime));
        let month = getMonth(parseDateFromUnixTime(minTime));

        if (i === 0) {
            dateType = dateTimeConstants.allDateRanges.ThisMonth.type;
        } else if (i === 1) {
            dateType = dateTimeConstants.allDateRanges.LastMonth.type;
        }

        recentDateRanges.push({
            dateType: dateType,
            minTime: minTime,
            maxTime: maxTime,
            year: year,
            month: month
        });
    }

    return recentDateRanges;
}

export function getRecentDateRangeTypeByDateType(allRecentMonthDateRanges, dateType) {
    for (let i = 0; i < allRecentMonthDateRanges.length; i++) {
        if (!allRecentMonthDateRanges[i].isPreset && allRecentMonthDateRanges[i].dateType === dateType) {
            return i;
        }
    }

    return -1;
}

export function getRecentDateRangeType(allRecentMonthDateRanges, dateType, minTime, maxTime, firstDayOfWeek) {
    let dateRange = getDateRangeByDateType(dateType, firstDayOfWeek);

    if (dateRange && dateRange.dateType === dateTimeConstants.allDateRanges.All.type) {
        return getRecentDateRangeTypeByDateType(allRecentMonthDateRanges, dateTimeConstants.allDateRanges.All.type);
    }

    if (!dateRange && (!maxTime || !minTime)) {
        return getRecentDateRangeTypeByDateType(allRecentMonthDateRanges, dateTimeConstants.allDateRanges.Custom.type);
    }

    if (!dateRange) {
        dateRange = {
            dateType: dateTimeConstants.allDateRanges.Custom.type,
            maxTime: maxTime,
            minTime: minTime
        };
    }

    for (let i = 0; i < allRecentMonthDateRanges.length; i++) {
        const recentDateRange = allRecentMonthDateRanges[i];

        if (recentDateRange.isPreset && recentDateRange.minTime === dateRange.minTime && recentDateRange.maxTime === dateRange.maxTime) {
            return i;
        }
    }

    return getRecentDateRangeTypeByDateType(allRecentMonthDateRanges, dateTimeConstants.allDateRanges.Custom.type);
}

export function getTimeValues(date, is24Hour, isMeridiemIndicatorFirst) {
    const hourMinuteSeconds = [
        getTwoDigitsString(is24Hour ? date.getHours() : getHourIn12HourFormat(date.getHours())),
        getTwoDigitsString(date.getMinutes()),
        getTwoDigitsString(date.getSeconds())
    ];

    if (is24Hour) {
        return hourMinuteSeconds;
    } else if (/*!is24Hour && */isMeridiemIndicatorFirst) {
        return [getAMOrPM(date.getHours())].concat(hourMinuteSeconds);
    } else /* !is24Hour && !isMeridiemIndicatorFirst */ {
        return hourMinuteSeconds.concat([getAMOrPM(date.getHours())]);
    }
}

export function getCombinedDateAndTimeValues(date, timeValues, is24Hour, isMeridiemIndicatorFirst) {
    let newDateTime = new Date(date.valueOf());
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (is24Hour) {
        hours = parseInt(timeValues[0]);
        minutes = parseInt(timeValues[1]);
        seconds = parseInt(timeValues[2]);
    } else {
        let meridiemIndicator;

        if (/*!is24Hour && */isMeridiemIndicatorFirst) {
            meridiemIndicator = timeValues[0];
            hours = parseInt(timeValues[1]);
            minutes = parseInt(timeValues[2]);
            seconds = parseInt(timeValues[3]);
        } else /* !is24Hour && !isMeridiemIndicatorFirst */ {
            hours = parseInt(timeValues[0]);
            minutes = parseInt(timeValues[1]);
            seconds = parseInt(timeValues[2]);
            meridiemIndicator = timeValues[3];
        }

        if (hours === 12) {
            hours = 0;
        }

        if (meridiemIndicator === dateTimeConstants.allMeridiemIndicators.PM) {
            hours += 12;
        }
    }

    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    newDateTime.setSeconds(seconds);

    return newDateTime;
}

export function isDateRangeMatchFullYears(minTime, maxTime) {
    const minDateTime = parseDateFromUnixTime(minTime).set({ second: 0, millisecond: 0 });
    const maxDateTime = parseDateFromUnixTime(maxTime).set({ second: 59, millisecond: 999 });

    const firstDayOfYear = minDateTime.clone().startOf('year');
    const lastDayOfYear = maxDateTime.clone().endOf('year');

    return firstDayOfYear.unix() === minDateTime.unix() && lastDayOfYear.unix() === maxDateTime.unix();
}

export function isDateRangeMatchFullMonths(minTime, maxTime) {
    const minDateTime = parseDateFromUnixTime(minTime).set({ second: 0, millisecond: 0 });
    const maxDateTime = parseDateFromUnixTime(maxTime).set({ second: 59, millisecond: 999 });

    const firstDayOfMonth = minDateTime.clone().startOf('month');
    const lastDayOfMonth = maxDateTime.clone().endOf('month');

    return firstDayOfMonth.unix() === minDateTime.unix() && lastDayOfMonth.unix() === maxDateTime.unix();
}

export function isDateRangeMatchOneMonth(minTime, maxTime) {
    const minDateTime = parseDateFromUnixTime(minTime);
    const maxDateTime = parseDateFromUnixTime(maxTime);

    if (getYear(minDateTime) !== getYear(maxDateTime) || getMonth(minDateTime) !== getMonth(maxDateTime)) {
        return false;
    }

    return isDateRangeMatchFullMonths(minTime, maxTime);
}

export function daysCurrentUntilDate(date) {
    const currentTime = dayjs();
    const endDateTime = dayjs.unix(date);
    const duration = endDateTime.diff(currentTime, 'day');
    const daysRemaining = Math.ceil(duration);
    return daysRemaining;
}