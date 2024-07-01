import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utcPlugin from "dayjs/plugin/utc";

import accountConstants from "@/consts/account.js";
import apiConstants from "@/consts/api.js";
import categoryConstants from "@/consts/category.js";
import currencyConstants from "@/consts/currency.js";
import datetimeConstants from "@/consts/datetime.js";
import numeralConstants from "@/consts/numeral.js";
import statisticsConstants from "@/consts/statistics.js";
import timezoneConstants from "@/consts/timezone.js";
import { allLanguages, defaultLanguage } from "@/locales/index.js";

import {
    copyArrayTo,
    copyObjectTo,
    getTextAfter,
    getTextBefore,
    isBoolean,
    isNumber,
    isString,
} from "./common.js";

import {
    formatTime,
    formatUnixTime,
    getBrowserTimezoneOffset,
    getBrowserTimezoneOffsetMinutes,
    getCurrentDateTime,
    getDateTimeFormatType,
    getRecentMonthDateRanges,
    getTimeDifferenceHoursAndMinutes,
    getTimezoneOffset,
    getTimezoneOffsetMinutes,
    getYear,
    isDateRangeMatchFullMonths,
    isDateRangeMatchFullYears,
    isPM,
    parseDateFromUnixTime,
} from "./datetime.js";

import {
    appendDigitGroupingSymbol,
    formatAmount,
    formatExchangeRateAmount,
    getAdaptiveDisplayAmountRate,
    parseAmount,
} from "./numeral.js";

import { appendCurrencySymbol } from "./currency.js";

import {
    getAllFilteredAccountsBalance,
    getCategorizedAccounts,
} from "./account.js";

import logger from "./logger.js";
import services from "./services.js";

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

const apiNotFoundErrorCode = 100001;
const specifiedApiNotFoundErrors = {
    "/api/register.json": {
        message: "User registration is disabled",
    },
};
const validatorErrorCode = 200000;
const parameterizedErrors = [
    {
        localeKey: "parameter invalid",
        regex: /^parameter "(\w+)" is invalid$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter required",
        regex: /^parameter "(\w+)" is required$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter too large",
        regex: /^parameter "(\w+)" must be less than (\d+)$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
            {
                field: "number",
                localized: false,
            },
        ],
    },
    {
        localeKey: "parameter too long",
        regex: /^parameter "(\w+)" must be less than (\d+) characters$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
            {
                field: "length",
                localized: false,
            },
        ],
    },
    {
        localeKey: "parameter too small",
        regex: /^parameter "(\w+)" must be more than (\d+)$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
            {
                field: "number",
                localized: false,
            },
        ],
    },
    {
        localeKey: "parameter too short",
        regex: /^parameter "(\w+)" must be more than (\d+) characters$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
            {
                field: "length",
                localized: false,
            },
        ],
    },
    {
        localeKey: "parameter length not equal",
        regex: /^parameter "(\w+)" length is not equal to (\d+)$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
            {
                field: "length",
                localized: false,
            },
        ],
    },
    {
        localeKey: "parameter cannot be blank",
        regex: /^parameter "(\w+)" cannot be blank$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter invalid username format",
        regex: /^parameter "(\w+)" is invalid username format$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter invalid email format",
        regex: /^parameter "(\w+)" is invalid email format$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter invalid currency",
        regex: /^parameter "(\w+)" is invalid currency$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
    {
        localeKey: "parameter invalid color",
        regex: /^parameter "(\w+)" is invalid color$/,
        parameters: [
            {
                field: "parameter",
                localized: true,
            },
        ],
    },
];

function getAllLanguageInfos() {
    return allLanguages;
}

function getAllLanguageInfoArray(translateFn, includeSystemDefault) {
    const ret = [];

    for (const code in allLanguages) {
        if (!Object.prototype.hasOwnProperty.call(allLanguages, code)) {
            continue;
        }

        const languageInfo = allLanguages[code];

        ret.push({
            code: code,
            displayName: languageInfo.displayName,
        });
    }

    ret.sort(function (lang1, lang2) {
        return lang1.code.localeCompare(lang2.code);
    });

    if (includeSystemDefault) {
        ret.splice(0, 0, {
            code: "",
            displayName: translateFn("System Default"),
        });
    }

    return ret;
}

function getLanguageInfo(locale) {
    return allLanguages[locale];
}

function getDefaultLanguage() {
    if (!window || !window.navigator) {
        return defaultLanguage;
    }

    let browserLocale =
        window.navigator.browserLanguage || window.navigator.language;

    if (!browserLocale) {
        return defaultLanguage;
    }

    if (!allLanguages[browserLocale]) {
        const locale = getLocaleFromLanguageAlias(browserLocale);

        if (locale) {
            browserLocale = locale;
        }
    }

    if (!allLanguages[browserLocale] && browserLocale.split("-").length > 1) {
        // maybe language-script-region
        const localeParts = browserLocale.split("-");
        browserLocale = localeParts[0] + "-" + localeParts[1];

        if (!allLanguages[browserLocale]) {
            const locale = getLocaleFromLanguageAlias(browserLocale);

            if (locale) {
                browserLocale = locale;
            }
        }

        if (!allLanguages[browserLocale]) {
            browserLocale = localeParts[0];
            const locale = getLocaleFromLanguageAlias(browserLocale);

            if (locale) {
                browserLocale = locale;
            }
        }
    }

    if (!allLanguages[browserLocale]) {
        return defaultLanguage;
    }

    return browserLocale;
}

function getLocaleFromLanguageAlias(alias) {
    for (let locale in allLanguages) {
        if (!Object.prototype.hasOwnProperty.call(allLanguages, locale)) {
            continue;
        }

        if (locale.toLowerCase() === alias.toLowerCase()) {
            return locale;
        }

        const lang = allLanguages[locale];
        const aliases = lang.aliases;

        if (!aliases || aliases.length < 1) {
            continue;
        }

        for (let i = 0; i < aliases.length; i++) {
            if (aliases[i].toLowerCase() === alias.toLowerCase()) {
                return locale;
            }
        }
    }

    return null;
}

function getCurrentLanguageCode(i18nGlobal) {
    return i18nGlobal.locale;
}

function getCurrentLanguageInfo(i18nGlobal) {
    const locale = getLanguageInfo(i18nGlobal.locale);

    if (locale) {
        return locale;
    }

    return getLanguageInfo(getDefaultLanguage());
}

function getCurrentLanguageDisplayName(i18nGlobal) {
    const currentLanguageInfo = getCurrentLanguageInfo(i18nGlobal);
    return currentLanguageInfo.displayName;
}

function getDefaultCurrency(translateFn) {
    return translateFn("default.currency");
}

function getDefaultFirstDayOfWeek(translateFn) {
    return translateFn("default.firstDayOfWeek");
}

function getCurrencyName(currencyCode, translateFn) {
    return translateFn(`currency.${currencyCode}`);
}

function getAllMeridiemIndicatorNames(translateFn) {
    return [
        translateFn("datetime.AM.content"),
        translateFn("datetime.PM.content"),
    ];
}

function getAllLongMonthNames(translateFn) {
    return [
        translateFn("datetime.January.long"),
        translateFn("datetime.February.long"),
        translateFn("datetime.March.long"),
        translateFn("datetime.April.long"),
        translateFn("datetime.May.long"),
        translateFn("datetime.June.long"),
        translateFn("datetime.July.long"),
        translateFn("datetime.August.long"),
        translateFn("datetime.September.long"),
        translateFn("datetime.October.long"),
        translateFn("datetime.November.long"),
        translateFn("datetime.December.long"),
    ];
}

function getAllShortMonthNames(translateFn) {
    return [
        translateFn("datetime.January.short"),
        translateFn("datetime.February.short"),
        translateFn("datetime.March.short"),
        translateFn("datetime.April.short"),
        translateFn("datetime.May.short"),
        translateFn("datetime.June.short"),
        translateFn("datetime.July.short"),
        translateFn("datetime.August.short"),
        translateFn("datetime.September.short"),
        translateFn("datetime.October.short"),
        translateFn("datetime.November.short"),
        translateFn("datetime.December.short"),
    ];
}

function getAllLongWeekdayNames(translateFn) {
    return [
        translateFn("datetime.Sunday.long"),
        translateFn("datetime.Monday.long"),
        translateFn("datetime.Tuesday.long"),
        translateFn("datetime.Wednesday.long"),
        translateFn("datetime.Thursday.long"),
        translateFn("datetime.Friday.long"),
        translateFn("datetime.Saturday.long"),
    ];
}

function getAllShortWeekdayNames(translateFn) {
    return [
        translateFn("datetime.Sunday.short"),
        translateFn("datetime.Monday.short"),
        translateFn("datetime.Tuesday.short"),
        translateFn("datetime.Wednesday.short"),
        translateFn("datetime.Thursday.short"),
        translateFn("datetime.Friday.short"),
        translateFn("datetime.Saturday.short"),
    ];
}

function getAllMinWeekdayNames(translateFn) {
    return [
        translateFn("datetime.Sunday.min"),
        translateFn("datetime.Monday.min"),
        translateFn("datetime.Tuesday.min"),
        translateFn("datetime.Wednesday.min"),
        translateFn("datetime.Thursday.min"),
        translateFn("datetime.Friday.min"),
        translateFn("datetime.Saturday.min"),
    ];
}

function getAllLongDateFormats(translateFn) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    return getDateTimeFormats(
        translateFn,
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        "format.longDate",
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat
    );
}

function getAllShortDateFormats(translateFn) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    return getDateTimeFormats(
        translateFn,
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        "format.shortDate",
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat
    );
}

function getAllLongTimeFormats(translateFn) {
    const defaultLongTimeFormatTypeName = translateFn("default.longTimeFormat");
    return getDateTimeFormats(
        translateFn,
        datetimeConstants.allLongTimeFormat,
        datetimeConstants.allLongTimeFormatArray,
        "format.longTime",
        defaultLongTimeFormatTypeName,
        datetimeConstants.defaultLongTimeFormat
    );
}

function getAllShortTimeFormats(translateFn) {
    const defaultShortTimeFormatTypeName = translateFn(
        "default.shortTimeFormat"
    );
    return getDateTimeFormats(
        translateFn,
        datetimeConstants.allShortTimeFormat,
        datetimeConstants.allShortTimeFormatArray,
        "format.shortTime",
        defaultShortTimeFormatTypeName,
        datetimeConstants.defaultShortTimeFormat
    );
}

function getMonthShortName(month, translateFn) {
    return translateFn(`datetime.${month}.short`);
}

function getMonthLongName(month, translateFn) {
    return translateFn(`datetime.${month}.long`);
}

function getWeekdayShortName(weekDay, translateFn) {
    return translateFn(`datetime.${weekDay}.short`);
}

function getWeekdayLongName(weekDay, translateFn) {
    return translateFn(`datetime.${weekDay}.long`);
}

function getI18nLongDateFormat(translateFn, formatTypeValue) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        "format.longDate",
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat,
        formatTypeValue
    );
}

function getI18nShortDateFormat(translateFn, formatTypeValue) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        "format.shortDate",
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat,
        formatTypeValue
    );
}

function getI18nLongYearFormat(translateFn, formatTypeValue) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        "format.longYear",
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat,
        formatTypeValue
    );
}

function getI18nShortYearFormat(translateFn, formatTypeValue) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        "format.shortYear",
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat,
        formatTypeValue
    );
}

function getI18nLongYearMonthFormat(translateFn, formatTypeValue) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        "format.longYearMonth",
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat,
        formatTypeValue
    );
}

function getI18nShortYearMonthFormat(translateFn, formatTypeValue) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        "format.shortYearMonth",
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat,
        formatTypeValue
    );
}

function getI18nLongMonthDayFormat(translateFn, formatTypeValue) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        "format.longMonthDay",
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat,
        formatTypeValue
    );
}

function getI18nShortMonthDayFormat(translateFn, formatTypeValue) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        "format.shortMonthDay",
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat,
        formatTypeValue
    );
}

function isLongDateMonthAfterYear(translateFn, formatTypeValue) {
    const defaultLongDateFormatTypeName = translateFn("default.longDateFormat");
    const type = getDateTimeFormatType(
        datetimeConstants.allLongDateFormat,
        datetimeConstants.allLongDateFormatArray,
        defaultLongDateFormatTypeName,
        datetimeConstants.defaultLongDateFormat,
        formatTypeValue
    );
    return type.isMonthAfterYear;
}

function isShortDateMonthAfterYear(translateFn, formatTypeValue) {
    const defaultShortDateFormatTypeName = translateFn(
        "default.shortDateFormat"
    );
    const type = getDateTimeFormatType(
        datetimeConstants.allShortDateFormat,
        datetimeConstants.allShortDateFormatArray,
        defaultShortDateFormatTypeName,
        datetimeConstants.defaultShortDateFormat,
        formatTypeValue
    );
    return type.isMonthAfterYear;
}

function getI18nLongTimeFormat(translateFn, formatTypeValue) {
    const defaultLongTimeFormatTypeName = translateFn("default.longTimeFormat");
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allLongTimeFormat,
        datetimeConstants.allLongTimeFormatArray,
        "format.longTime",
        defaultLongTimeFormatTypeName,
        datetimeConstants.defaultLongTimeFormat,
        formatTypeValue
    );
}

function getI18nShortTimeFormat(translateFn, formatTypeValue) {
    const defaultShortTimeFormatTypeName = translateFn(
        "default.shortTimeFormat"
    );
    return getDateTimeFormat(
        translateFn,
        datetimeConstants.allShortTimeFormat,
        datetimeConstants.allShortTimeFormatArray,
        "format.shortTime",
        defaultShortTimeFormatTypeName,
        datetimeConstants.defaultShortTimeFormat,
        formatTypeValue
    );
}

function isLongTime24HourFormat(translateFn, formatTypeValue) {
    const defaultLongTimeFormatTypeName = translateFn("default.longTimeFormat");
    const type = getDateTimeFormatType(
        datetimeConstants.allLongTimeFormat,
        datetimeConstants.allLongTimeFormatArray,
        defaultLongTimeFormatTypeName,
        datetimeConstants.defaultLongTimeFormat,
        formatTypeValue
    );
    return type.is24HourFormat;
}

function isLongTimeMeridiemIndicatorFirst(translateFn, formatTypeValue) {
    const defaultLongTimeFormatTypeName = translateFn("default.longTimeFormat");
    const type = getDateTimeFormatType(
        datetimeConstants.allLongTimeFormat,
        datetimeConstants.allLongTimeFormatArray,
        defaultLongTimeFormatTypeName,
        datetimeConstants.defaultLongTimeFormat,
        formatTypeValue
    );
    return type.isMeridiemIndicatorFirst;
}

function isShortTime24HourFormat(translateFn, formatTypeValue) {
    const defaultShortTimeFormatTypeName = translateFn(
        "default.shortTimeFormat"
    );
    const type = getDateTimeFormatType(
        datetimeConstants.allShortTimeFormat,
        datetimeConstants.allShortTimeFormatArray,
        defaultShortTimeFormatTypeName,
        datetimeConstants.defaultShortTimeFormat,
        formatTypeValue
    );
    return type.is24HourFormat;
}

function isShortTimeMeridiemIndicatorFirst(translateFn, formatTypeValue) {
    const defaultShortTimeFormatTypeName = translateFn(
        "default.shortTimeFormat"
    );
    const type = getDateTimeFormatType(
        datetimeConstants.allShortTimeFormat,
        datetimeConstants.allShortTimeFormatArray,
        defaultShortTimeFormatTypeName,
        datetimeConstants.defaultShortTimeFormat,
        formatTypeValue
    );
    return type.isMeridiemIndicatorFirst;
}

function getDateTimeFormats(
    translateFn,
    allFormatMap,
    allFormatArray,
    localeFormatPathPrefix,
    localeDefaultFormatTypeName,
    systemDefaultFormatType
) {
    const defaultFormat = getDateTimeFormat(
        translateFn,
        allFormatMap,
        allFormatArray,
        localeFormatPathPrefix,
        localeDefaultFormatTypeName,
        systemDefaultFormatType,
        datetimeConstants.defaultDateTimeFormatValue
    );
    const ret = [];

    ret.push({
        type: datetimeConstants.defaultDateTimeFormatValue,
        format: defaultFormat,
        displayName: `${translateFn("Language Default")} (${formatTime(
            getCurrentDateTime(),
            defaultFormat
        )})`,
    });

    for (let i = 0; i < allFormatArray.length; i++) {
        const formatType = allFormatArray[i];
        const format = translateFn(
            `${localeFormatPathPrefix}.${formatType.key}`
        );

        ret.push({
            type: formatType.type,
            format: format,
            displayName: formatTime(getCurrentDateTime(), format),
        });
    }

    return ret;
}

function getDateTimeFormat(
    translateFn,
    allFormatMap,
    allFormatArray,
    localeFormatPathPrefix,
    localeDefaultFormatTypeName,
    systemDefaultFormatType,
    formatTypeValue
) {
    const type = getDateTimeFormatType(
        allFormatMap,
        allFormatArray,
        localeDefaultFormatTypeName,
        systemDefaultFormatType,
        formatTypeValue
    );
    return translateFn(`${localeFormatPathPrefix}.${type.key}`);
}

function getAllTimezones(includeSystemDefault, translateFn) {
    const defaultTimezoneOffset = getBrowserTimezoneOffset();
    const defaultTimezoneOffsetMinutes = getBrowserTimezoneOffsetMinutes();
    const allTimezones = timezoneConstants.all;
    const allTimezoneInfos = [];

    for (let i = 0; i < allTimezones.length; i++) {
        const utcOffset =
            allTimezones[i].timezoneName !== timezoneConstants.utcTimezoneName
                ? getTimezoneOffset(allTimezones[i].timezoneName)
                : "";
        const displayName = translateFn(
            `timezone.${allTimezones[i].displayName}`
        );

        allTimezoneInfos.push({
            name: allTimezones[i].timezoneName,
            utcOffset: utcOffset,
            utcOffsetMinutes: getTimezoneOffsetMinutes(
                allTimezones[i].timezoneName
            ),
            displayName: displayName,
            displayNameWithUtcOffset: `(UTC${utcOffset}) ${displayName}`,
        });
    }

    if (includeSystemDefault) {
        const defaultDisplayName = translateFn("System Default");

        allTimezoneInfos.push({
            name: "",
            utcOffset: defaultTimezoneOffset,
            utcOffsetMinutes: defaultTimezoneOffsetMinutes,
            displayName: defaultDisplayName,
            displayNameWithUtcOffset: `(UTC${defaultTimezoneOffset}) ${defaultDisplayName}`,
        });
    }

    allTimezoneInfos.sort(function (c1, c2) {
        const utcOffset1 = parseInt(c1.utcOffset.replace(":", ""));
        const utcOffset2 = parseInt(c2.utcOffset.replace(":", ""));

        if (utcOffset1 !== utcOffset2) {
            return utcOffset1 - utcOffset2;
        }

        return c1.displayName.localeCompare(c2.displayName);
    });

    return allTimezoneInfos;
}

function getTimezoneDifferenceDisplayText(utcOffset, translateFn) {
    const defaultTimezoneOffset = getTimezoneOffsetMinutes();
    const offsetTime = getTimeDifferenceHoursAndMinutes(
        utcOffset - defaultTimezoneOffset
    );

    if (utcOffset > defaultTimezoneOffset) {
        if (offsetTime.offsetMinutes) {
            return translateFn(
                "format.misc.hoursMinutesAheadOfDefaultTimezone",
                {
                    hours: offsetTime.offsetHours,
                    minutes: offsetTime.offsetMinutes,
                }
            );
        } else {
            return translateFn("format.misc.hoursAheadOfDefaultTimezone", {
                hours: offsetTime.offsetHours,
            });
        }
    } else if (utcOffset < defaultTimezoneOffset) {
        if (offsetTime.offsetMinutes) {
            return translateFn(
                "format.misc.hoursMinutesBehindDefaultTimezone",
                {
                    hours: offsetTime.offsetHours,
                    minutes: offsetTime.offsetMinutes,
                }
            );
        } else {
            return translateFn("format.misc.hoursBehindDefaultTimezone", {
                hours: offsetTime.offsetHours,
            });
        }
    } else {
        return translateFn("Same time as default timezone");
    }
}

function getAllCurrencies(translateFn) {
    const allCurrencyCodes = currencyConstants.all;
    const allCurrencies = [];

    for (let currencyCode in allCurrencyCodes) {
        if (
            !Object.prototype.hasOwnProperty.call(
                allCurrencyCodes,
                currencyCode
            )
        ) {
            continue;
        }

        allCurrencies.push({
            code: currencyCode,
            displayName: getCurrencyName(currencyCode, translateFn),
        });
    }

    allCurrencies.sort(function (c1, c2) {
        return c1.displayName.localeCompare(c2.displayName);
    });

    return allCurrencies;
}

function getAllWeekDays(translateFn) {
    const allWeekDays = [];

    for (let i = 0; i < datetimeConstants.allWeekDaysArray.length; i++) {
        const weekDay = datetimeConstants.allWeekDaysArray[i];

        allWeekDays.push({
            type: weekDay.type,
            displayName: translateFn(`datetime.${weekDay.name}.long`),
        });
    }

    return allWeekDays;
}

function getAllDateRanges(scene, includeCustom, translateFn) {
    const allDateRanges = [];

    for (let dateRangeField in datetimeConstants.allDateRanges) {
        if (
            !Object.prototype.hasOwnProperty.call(
                datetimeConstants.allDateRanges,
                dateRangeField
            )
        ) {
            continue;
        }

        const dateRangeType = datetimeConstants.allDateRanges[dateRangeField];

        if (!dateRangeType.availableScenes[scene]) {
            continue;
        }

        if (
            includeCustom ||
            dateRangeType.type !== datetimeConstants.allDateRanges.Custom.type
        ) {
            allDateRanges.push({
                type: dateRangeType.type,
                displayName: translateFn(dateRangeType.name),
            });
        }
    }

    return allDateRanges;
}

function getAllRecentMonthDateRanges(
    userStore,
    includeAll,
    includeCustom,
    translateFn
) {
    const allRecentMonthDateRanges = [];
    const recentDateRanges = getRecentMonthDateRanges(12);

    if (includeAll) {
        allRecentMonthDateRanges.push({
            dateType: datetimeConstants.allDateRanges.All.type,
            minTime: 0,
            maxTime: 0,
            displayName: translateFn("All"),
        });
    }

    for (let i = 0; i < recentDateRanges.length; i++) {
        const recentDateRange = recentDateRanges[i];

        allRecentMonthDateRanges.push({
            dateType: recentDateRange.dateType,
            minTime: recentDateRange.minTime,
            maxTime: recentDateRange.maxTime,
            year: recentDateRange.year,
            month: recentDateRange.month,
            isPreset: true,
            displayName: formatUnixTime(
                recentDateRange.minTime,
                getI18nLongYearMonthFormat(
                    translateFn,
                    userStore.currentUserLongDateFormat
                )
            ),
        });
    }

    if (includeCustom) {
        allRecentMonthDateRanges.push({
            dateType: datetimeConstants.allDateRanges.Custom.type,
            minTime: 0,
            maxTime: 0,
            displayName: translateFn("Custom Date"),
        });
    }

    return allRecentMonthDateRanges;
}

function getDateRangeDisplayName(
    userStore,
    dateType,
    startTime,
    endTime,
    translateFn
) {
    if (dateType === datetimeConstants.allDateRanges.All.type) {
        return translateFn(datetimeConstants.allDateRanges.All.name);
    }

    for (let dateRangeField in datetimeConstants.allDateRanges) {
        if (
            !Object.prototype.hasOwnProperty.call(
                datetimeConstants.allDateRanges,
                dateRangeField
            )
        ) {
            continue;
        }

        const dateRange = datetimeConstants.allDateRanges[dateRangeField];

        if (
            dateRange &&
            dateRange.type !== datetimeConstants.allDateRanges.Custom.type &&
            dateRange.type === dateType &&
            dateRange.name
        ) {
            return translateFn(dateRange.name);
        }
    }

    if (isDateRangeMatchFullYears(startTime, endTime)) {
        const displayStartTime = formatUnixTime(
            startTime,
            getI18nShortYearFormat(
                translateFn,
                userStore.currentUserShortDateFormat
            )
        );
        const displayEndTime = formatUnixTime(
            endTime,
            getI18nShortYearFormat(
                translateFn,
                userStore.currentUserShortDateFormat
            )
        );

        return displayStartTime !== displayEndTime
            ? `${displayStartTime} ~ ${displayEndTime}`
            : displayStartTime;
    }

    if (isDateRangeMatchFullMonths(startTime, endTime)) {
        const displayStartTime = formatUnixTime(
            startTime,
            getI18nShortYearMonthFormat(
                translateFn,
                userStore.currentUserShortDateFormat
            )
        );
        const displayEndTime = formatUnixTime(
            endTime,
            getI18nShortYearMonthFormat(
                translateFn,
                userStore.currentUserShortDateFormat
            )
        );

        return displayStartTime !== displayEndTime
            ? `${displayStartTime} ~ ${displayEndTime}`
            : displayStartTime;
    }

    const startTimeYear = getYear(parseDateFromUnixTime(startTime));
    const endTimeYear = getYear(parseDateFromUnixTime(endTime));

    const displayStartTime = formatUnixTime(
        startTime,
        getI18nShortDateFormat(
            translateFn,
            userStore.currentUserShortDateFormat
        )
    );
    const displayEndTime = formatUnixTime(
        endTime,
        getI18nShortDateFormat(
            translateFn,
            userStore.currentUserShortDateFormat
        )
    );

    if (displayStartTime === displayEndTime) {
        return displayStartTime;
    } else if (startTimeYear === endTimeYear) {
        const displayShortEndTime = formatUnixTime(
            endTime,
            getI18nShortMonthDayFormat(
                translateFn,
                userStore.currentUserShortDateFormat
            )
        );
        return `${displayStartTime} ~ ${displayShortEndTime}`;
    }

    return `${displayStartTime} ~ ${displayEndTime}`;
}

function getAllTimezoneTypesUsedForStatistics(currentTimezone, translateFn) {
    const currentTimezoneOffset = getTimezoneOffset(currentTimezone);

    return [
        {
            displayName:
                translateFn("Application Timezone") +
                ` (UTC${currentTimezoneOffset})`,
            type: timezoneConstants.allTimezoneTypesUsedForStatistics
                .ApplicationTimezone,
        },
        {
            displayName: translateFn("Transaction Timezone"),
            type: timezoneConstants.allTimezoneTypesUsedForStatistics
                .TransactionTimezone,
        },
    ];
}

function getAllDecimalSeparators(translateFn) {
    const defaultDecimalSeparatorTypeName = translateFn(
        "default.decimalSeparator"
    );
    return getNumeralSeparatorFormats(
        translateFn,
        numeralConstants.allDecimalSeparator,
        numeralConstants.allDecimalSeparatorArray,
        defaultDecimalSeparatorTypeName,
        numeralConstants.defaultDecimalSeparator
    );
}

function getAllDigitGroupingSymbols(translateFn) {
    const defaultDigitGroupingSymbolTypeName = translateFn(
        "default.digitGroupingSymbol"
    );
    return getNumeralSeparatorFormats(
        translateFn,
        numeralConstants.allDigitGroupingSymbol,
        numeralConstants.allDigitGroupingSymbolArray,
        defaultDigitGroupingSymbolTypeName,
        numeralConstants.defaultDigitGroupingSymbol
    );
}

function getNumeralSeparatorFormats(
    translateFn,
    allSeparatorMap,
    allSeparatorArray,
    localeDefaultTypeName,
    systemDefaultType
) {
    let defaultSeparatorType = allSeparatorMap[localeDefaultTypeName];

    if (!defaultSeparatorType) {
        defaultSeparatorType = systemDefaultType;
    }

    const ret = [];

    ret.push({
        type: numeralConstants.defaultValue,
        symbol: defaultSeparatorType.symbol,
        displayName: `${translateFn("Language Default")} (${
            defaultSeparatorType.symbol
        })`,
    });

    for (let i = 0; i < allSeparatorArray.length; i++) {
        const type = allSeparatorArray[i];

        ret.push({
            type: type.type,
            symbol: type.symbol,
            displayName: `${translateFn("numeral." + type.name)} (${
                type.symbol
            })`,
        });
    }

    return ret;
}

function getAllDigitGroupingTypes(translateFn) {
    const defaultDigitGroupingTypeName = translateFn("default.digitGrouping");
    let defaultDigitGroupingType =
        numeralConstants.allDigitGroupingType[defaultDigitGroupingTypeName];

    if (!defaultDigitGroupingType) {
        defaultDigitGroupingType = numeralConstants.defaultDigitGroupingType;
    }

    const ret = [];

    ret.push({
        type: numeralConstants.defaultValue,
        displayName: `${translateFn("Language Default")} (${translateFn(
            "numeral." + defaultDigitGroupingType.name
        )})`,
    });

    for (
        let i = 0;
        i < numeralConstants.allDigitGroupingTypeArray.length;
        i++
    ) {
        const type = numeralConstants.allDigitGroupingTypeArray[i];

        ret.push({
            type: type.type,
            displayName: translateFn("numeral." + type.name),
        });
    }

    return ret;
}

function getAllCurrencyDisplayTypes(userStore, settingsStore, translateFn) {
    const defaultCurrencyDisplayTypeName = translateFn(
        "default.currencyDisplayType"
    );
    let defaultCurrencyDisplayType =
        currencyConstants.allCurrencyDisplayType[
            defaultCurrencyDisplayTypeName
        ];

    if (!defaultCurrencyDisplayType) {
        defaultCurrencyDisplayType =
            currencyConstants.defaultCurrencyDisplayType;
    }

    const defaultCurrency = userStore.currentUserDefaultCurrency;

    const ret = [];
    const defaultSampleValue = getFormatedAmountWithCurrency(
        12345,
        defaultCurrency,
        translateFn,
        userStore,
        settingsStore,
        false,
        defaultCurrencyDisplayType
    );

    ret.push({
        type: currencyConstants.defaultCurrencyDisplayTypeValue,
        displayName: `${translateFn(
            "Language Default"
        )} (${defaultSampleValue})`,
    });

    for (
        let i = 0;
        i < currencyConstants.allCurrencyDisplayTypeArray.length;
        i++
    ) {
        const type = currencyConstants.allCurrencyDisplayTypeArray[i];
        let displayName = translateFn(type.name);

        if (type.symbol !== currencyConstants.allCurrencyDisplaySymbol.None) {
            const sampleValue = getFormatedAmountWithCurrency(
                12345,
                defaultCurrency,
                translateFn,
                userStore,
                settingsStore,
                false,
                type
            );
            displayName = `${displayName} (${sampleValue})`;
        }

        ret.push({
            type: type.type,
            displayName: displayName,
        });
    }

    return ret;
}

function getCurrentDecimalSeparator(translateFn, decimalSeparator) {
    let decimalSeparatorType =
        numeralConstants.allDecimalSeparatorMap[decimalSeparator];

    if (!decimalSeparatorType) {
        const defaultDecimalSeparatorTypeName = translateFn(
            "default.decimalSeparator"
        );
        decimalSeparatorType =
            numeralConstants.allDecimalSeparator[
                defaultDecimalSeparatorTypeName
            ];

        if (!decimalSeparatorType) {
            decimalSeparatorType = numeralConstants.defaultDecimalSeparator;
        }
    }

    return decimalSeparatorType.symbol;
}

function getCurrentDigitGroupingSymbol(translateFn, digitGroupingSymbol) {
    let digitGroupingSymbolType =
        numeralConstants.allDigitGroupingSymbolMap[digitGroupingSymbol];

    if (!digitGroupingSymbolType) {
        const defaultDigitGroupingSymbolTypeName = translateFn(
            "default.digitGroupingSymbol"
        );
        digitGroupingSymbolType =
            numeralConstants.allDigitGroupingSymbol[
                defaultDigitGroupingSymbolTypeName
            ];

        if (!digitGroupingSymbolType) {
            digitGroupingSymbolType =
                numeralConstants.defaultDigitGroupingSymbol;
        }
    }

    return digitGroupingSymbolType.symbol;
}

function getCurrentDigitGroupingType(translateFn, digitGrouping) {
    let digitGroupingType =
        numeralConstants.allDigitGroupingTypeMap[digitGrouping];

    if (!digitGroupingType) {
        const defaultDigitGroupingTypeName = translateFn(
            "default.digitGrouping"
        );
        digitGroupingType =
            numeralConstants.allDigitGroupingType[defaultDigitGroupingTypeName];

        if (!digitGroupingType) {
            digitGroupingType = numeralConstants.defaultDigitGroupingType;
        }
    }

    return digitGroupingType.type;
}

function getNumberFormatOptions(translateFn, userStore) {
    return {
        decimalSeparator: getCurrentDecimalSeparator(
            translateFn,
            userStore.currentUserDecimalSeparator
        ),
        digitGroupingSymbol: getCurrentDigitGroupingSymbol(
            translateFn,
            userStore.currentUserDigitGroupingSymbol
        ),
        digitGrouping: getCurrentDigitGroupingType(
            translateFn,
            userStore.currentUserDigitGrouping
        ),
    };
}

function getNumberWithDigitGroupingSymbol(value, translateFn, userStore) {
    const numberFormatOptions = getNumberFormatOptions(translateFn, userStore);
    return appendDigitGroupingSymbol(value, numberFormatOptions);
}

function getParsedAmountNumber(value, translateFn, userStore) {
    const numberFormatOptions = getNumberFormatOptions(translateFn, userStore);
    return parseAmount(value, numberFormatOptions);
}

function getFormatedAmount(value, translateFn, userStore) {
    const numberFormatOptions = getNumberFormatOptions(translateFn, userStore);
    return formatAmount(value, numberFormatOptions);
}

function getFormatedAmountWithCurrency(
    value,
    currencyCode,
    translateFn,
    userStore,
    settingsStore,
    notConvertValue,
    currencyDisplayType
) {
    if (!isNumber(value) && !isString(value)) {
        return value;
    }

    if (isNumber(value)) {
        value = value.toString();
    }

    if (!notConvertValue) {
        const numberFormatOptions = getNumberFormatOptions(
            translateFn,
            userStore
        );
        const hasIncompleteFlag =
            isString(value) && value.charAt(value.length - 1) === "+";

        if (hasIncompleteFlag) {
            value = value.substring(0, value.length - 1);
        }

        value = formatAmount(value, numberFormatOptions);

        if (hasIncompleteFlag) {
            value = value + "+";
        }
    }

    if (!isBoolean(currencyCode) && !currencyCode) {
        currencyCode = userStore.currentUserDefaultCurrency;
    } else if (isBoolean(currencyCode) && !currencyCode) {
        currencyCode = "";
    }

    if (!currencyCode) {
        return value;
    }

    if (!currencyDisplayType) {
        currencyDisplayType =
            currencyConstants.allCurrencyDisplayTypeMap[
                userStore.currentUserCurrencyDisplayType
            ];

        if (!currencyDisplayType) {
            const defaultCurrencyDisplayTypeName = translateFn(
                "default.currencyDisplayType"
            );
            currencyDisplayType =
                currencyConstants.allCurrencyDisplayType[
                    defaultCurrencyDisplayTypeName
                ];
        }

        if (!currencyDisplayType) {
            currencyDisplayType = currencyConstants.defaultCurrencyDisplayType;
        }
    }

    const currencyName = getCurrencyName(currencyCode, translateFn);
    return appendCurrencySymbol(
        value,
        currencyDisplayType,
        currencyCode,
        currencyName
    );
}

function getFormatedExchangeRateAmount(value, translateFn, userStore) {
    const numberFormatOptions = getNumberFormatOptions(translateFn, userStore);
    return formatExchangeRateAmount(value, numberFormatOptions);
}

function getAdaptiveAmountRate(
    amount1,
    amount2,
    fromExchangeRate,
    toExchangeRate,
    translateFn,
    userStore
) {
    const numberFormatOptions = getNumberFormatOptions(translateFn, userStore);
    return getAdaptiveDisplayAmountRate(
        amount1,
        amount2,
        fromExchangeRate,
        toExchangeRate,
        numberFormatOptions
    );
}

function getAmountPrependAndAppendText(
    currencyCode,
    translateFn,
    userStore,
    settingsStore
) {
    const placeholder = "***";
    const finalText = getFormatedAmountWithCurrency(
        placeholder,
        currencyCode,
        translateFn,
        userStore,
        settingsStore,
        true
    );

    if (!finalText) {
        return null;
    }

    let prependText = getTextBefore(finalText, placeholder);

    if (prependText) {
        prependText = prependText.trim();
    }

    let appendText = getTextAfter(finalText, placeholder);

    if (appendText) {
        appendText = appendText.trim();
    }

    return {
        prependText: prependText,
        appendText: appendText,
    };
}

function getAllAccountCategories(translateFn) {
    const allAccountCategories = [];

    for (let i = 0; i < accountConstants.allCategories.length; i++) {
        const accountCategory = accountConstants.allCategories[i];

        allAccountCategories.push({
            id: accountCategory.id,
            displayName: translateFn(accountCategory.name),
            defaultAccountIconId: accountCategory.defaultAccountIconId,
        });
    }

    return allAccountCategories;
}

function getAllAccountTypes(translateFn) {
    const allAccountTypes = [];

    for (let i = 0; i < accountConstants.allAccountTypesArray.length; i++) {
        const accountType = accountConstants.allAccountTypesArray[i];

        allAccountTypes.push({
            id: accountType.id,
            displayName: translateFn(accountType.name),
        });
    }

    return allAccountTypes;
}

function getAllCategoricalChartTypes(translateFn) {
    const allChartTypes = [];

    for (
        let i = 0;
        i < statisticsConstants.allCategoricalChartTypesArray.length;
        i++
    ) {
        const chartType = statisticsConstants.allCategoricalChartTypesArray[i];

        allChartTypes.push({
            type: chartType.type,
            displayName: translateFn(chartType.name),
        });
    }

    return allChartTypes;
}

function getAllTrendChartTypes(translateFn) {
    const allChartTypes = [];

    for (
        let i = 0;
        i < statisticsConstants.allTrendChartTypesArray.length;
        i++
    ) {
        const chartType = statisticsConstants.allTrendChartTypesArray[i];

        allChartTypes.push({
            type: chartType.type,
            displayName: translateFn(chartType.name),
        });
    }

    return allChartTypes;
}

function getAllStatisticsChartDataTypes(translateFn) {
    const allChartDataTypes = [];

    for (const dataTypeField in statisticsConstants.allChartDataTypes) {
        if (
            !Object.prototype.hasOwnProperty.call(
                statisticsConstants.allChartDataTypes,
                dataTypeField
            )
        ) {
            continue;
        }

        const chartDataType =
            statisticsConstants.allChartDataTypes[dataTypeField];

        allChartDataTypes.push({
            type: chartDataType.type,
            displayName: translateFn(chartDataType.name),
            availableAnalysisTypes: chartDataType.availableAnalysisTypes,
        });
    }

    return allChartDataTypes;
}

function getAllStatisticsSortingTypes(translateFn) {
    const allSortingTypes = [];

    for (const sortingTypeField in statisticsConstants.allSortingTypes) {
        if (
            !Object.prototype.hasOwnProperty.call(
                statisticsConstants.allSortingTypes,
                sortingTypeField
            )
        ) {
            continue;
        }

        const sortingType =
            statisticsConstants.allSortingTypes[sortingTypeField];

        allSortingTypes.push({
            type: sortingType.type,
            displayName: translateFn(sortingType.name),
            displayFullName: translateFn(sortingType.fullName),
        });
    }

    return allSortingTypes;
}

function getAllTransactionEditScopeTypes(translateFn) {
    return [
        {
            type: 0,
            displayName: translateFn("None"),
        },
        {
            type: 1,
            displayName: translateFn("All"),
        },
        {
            type: 2,
            displayName: translateFn("Today or later"),
        },
        {
            type: 3,
            displayName: translateFn("Recent 24 hours or later"),
        },
        {
            type: 4,
            displayName: translateFn("This week or later"),
        },
        {
            type: 5,
            displayName: translateFn("This month or later"),
        },
        {
            type: 6,
            displayName: translateFn("This year or later"),
        },
    ];
}

function getAllTransactionDefaultCategories(categoryType, locale, translateFn) {
    const allCategories = {};
    const categoryTypes = [];

    if (categoryType === 0) {
        for (
            let i = categoryConstants.allCategoryTypes.Income;
            i <= categoryConstants.allCategoryTypes.Transfer;
            i++
        ) {
            categoryTypes.push(i);
        }
    } else {
        categoryTypes.push(categoryType);
    }

    for (let i = 0; i < categoryTypes.length; i++) {
        const categories = [];
        const categoryType = categoryTypes[i];
        let defaultCategories = [];

        if (categoryType === categoryConstants.allCategoryTypes.Income) {
            defaultCategories = copyArrayTo(
                categoryConstants.defaultIncomeCategories,
                []
            );
        } else if (
            categoryType === categoryConstants.allCategoryTypes.Expense
        ) {
            defaultCategories = copyArrayTo(
                categoryConstants.defaultExpenseCategories,
                []
            );
        } else if (
            categoryType === categoryConstants.allCategoryTypes.Transfer
        ) {
            defaultCategories = copyArrayTo(
                categoryConstants.defaultTransferCategories,
                []
            );
        }

        for (let j = 0; j < defaultCategories.length; j++) {
            const category = defaultCategories[j];

            const submitCategory = {
                name: translateFn("category." + category.name, locale),
                type: categoryType,
                icon: category.categoryIconId,
                color: category.color,
                subCategories: [],
            };

            for (let k = 0; k < category.subCategories.length; k++) {
                const subCategory = category.subCategories[k];
                submitCategory.subCategories.push({
                    name: translateFn("category." + subCategory.name, locale),
                    type: categoryType,
                    icon: subCategory.categoryIconId,
                    color: subCategory.color,
                });
            }

            categories.push(submitCategory);
        }

        allCategories[categoryType] = categories;
    }

    return allCategories;
}

function getAllDisplayExchangeRates(exchangeRatesData, translateFn) {
    if (!exchangeRatesData || !exchangeRatesData.exchangeRates) {
        return [];
    }

    const availableExchangeRates = [];

    for (let i = 0; i < exchangeRatesData.exchangeRates.length; i++) {
        const exchangeRate = exchangeRatesData.exchangeRates[i];

        availableExchangeRates.push({
            currencyCode: exchangeRate.currency,
            currencyDisplayName: getCurrencyName(
                exchangeRate.currency,
                translateFn
            ),
            rate: exchangeRate.rate,
        });
    }

    availableExchangeRates.sort(function (c1, c2) {
        return c1.currencyDisplayName.localeCompare(c2.currencyDisplayName);
    });

    return availableExchangeRates;
}

function getEnableDisableOptions(translateFn) {
    return [
        {
            value: true,
            displayName: translateFn("Enable"),
        },
        {
            value: false,
            displayName: translateFn("Disable"),
        },
    ];
}

function getCategorizedAccountsWithDisplayBalance(
    allVisibleAccounts,
    showAccountBalance,
    defaultCurrency,
    userStore,
    settingsStore,
    exchangeRatesStore,
    translateFn
) {
    const categorizedAccounts = copyObjectTo(
        getCategorizedAccounts(allVisibleAccounts),
        {}
    );

    for (let category in categorizedAccounts) {
        if (
            !Object.prototype.hasOwnProperty.call(categorizedAccounts, category)
        ) {
            continue;
        }

        const accountCategory = categorizedAccounts[category];

        if (accountCategory.accounts) {
            for (let i = 0; i < accountCategory.accounts.length; i++) {
                const account = accountCategory.accounts[i];

                if (showAccountBalance && account.isAsset) {
                    account.displayBalance = getFormatedAmountWithCurrency(
                        account.balance,
                        account.currency,
                        translateFn,
                        userStore,
                        settingsStore
                    );
                } else if (showAccountBalance && account.isLiability) {
                    account.displayBalance = getFormatedAmountWithCurrency(
                        -account.balance,
                        account.currency,
                        translateFn,
                        userStore,
                        settingsStore
                    );
                } else {
                    account.displayBalance = "***";
                }
            }
        }

        if (showAccountBalance) {
            const accountsBalance = getAllFilteredAccountsBalance(
                categorizedAccounts,
                (account) => account.category === accountCategory.category
            );
            let totalBalance = 0;
            let hasUnCalculatedAmount = false;

            for (let i = 0; i < accountsBalance.length; i++) {
                if (accountsBalance[i].currency === defaultCurrency) {
                    if (accountsBalance[i].isAsset) {
                        totalBalance += accountsBalance[i].balance;
                    } else if (accountsBalance[i].isLiability) {
                        totalBalance -= accountsBalance[i].balance;
                    }
                } else {
                    const balance = exchangeRatesStore.getExchangedAmount(
                        accountsBalance[i].balance,
                        accountsBalance[i].currency,
                        defaultCurrency
                    );

                    if (!isNumber(balance)) {
                        hasUnCalculatedAmount = true;
                        continue;
                    }

                    if (accountsBalance[i].isAsset) {
                        totalBalance += Math.floor(balance);
                    } else if (accountsBalance[i].isLiability) {
                        totalBalance -= Math.floor(balance);
                    }
                }
            }

            if (hasUnCalculatedAmount) {
                totalBalance = totalBalance + "+";
            }

            accountCategory.displayBalance = getFormatedAmountWithCurrency(
                totalBalance,
                defaultCurrency,
                translateFn,
                userStore,
                settingsStore
            );
        } else {
            accountCategory.displayBalance = "***";
        }
    }

    return categorizedAccounts;
}

function joinMultiText(textArray, translateFn) {
    if (!textArray || !textArray.length) {
        return "";
    }

    const separator = translateFn("format.misc.multiTextJoinSeparator");

    return textArray.join(separator);
}

function getLocalizedError(error) {
    if (
        error.errorCode === apiConstants.apiNotFoundErrorCode &&
        apiConstants.specifiedApiNotFoundErrors[error.path]
    ) {
        return {
            message: `${
                apiConstants.specifiedApiNotFoundErrors[error.path].message
            }`,
        };
    }

    if (error.errorCode !== apiConstants.validatorErrorCode) {
        return {
            message: `error.${error.errorMessage}`,
        };
    }

    for (let i = 0; i < apiConstants.parameterizedErrors.length; i++) {
        const errorInfo = apiConstants.parameterizedErrors[i];
        const matches = error.errorMessage.match(errorInfo.regex);

        if (matches && matches.length === errorInfo.parameters.length + 1) {
            return {
                message: `parameterizedError.${errorInfo.localeKey}`,
                parameters: errorInfo.parameters.map((param, index) => {
                    return {
                        key: param.field,
                        localized: param.localized,
                        value: matches[index + 1],
                    };
                }),
            };
        }
    }

    return {
        message: `error.${error.errorMessage}`,
    };
}

function getLocalizedErrorParameters(parameters, i18nFunc) {
    let localizedParameters = {};

    if (parameters) {
        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i];

            if (parameter.localized) {
                localizedParameters[parameter.key] = i18nFunc(
                    `parameter.${parameter.value}`
                );
            } else {
                localizedParameters[parameter.key] = parameter.value;
            }
        }
    }

    return localizedParameters;
}

function setLanguage(i18nGlobal, locale, force) {
    if (!locale) {
        locale = getDefaultLanguage();
        logger.info(
            `No specified language, use browser default language ${locale}`
        );
    }

    if (!getLanguageInfo(locale)) {
        locale = getDefaultLanguage();
        logger.warn(
            `Not found language ${locale}, use browser default language ${locale}`
        );
    }

    if (!force && i18nGlobal.locale === locale) {
        logger.info(`Current locale is already ${locale}`);
        return null;
    }

    logger.info(`Apply current language to ${locale}`);

    i18nGlobal.locale = locale;
    dayjs.locale(locale, {
        months: getAllLongMonthNames(i18nGlobal.t),
        monthsShort: getAllShortMonthNames(i18nGlobal.t),
        weekdays: getAllLongWeekdayNames(i18nGlobal.t),
        weekdaysShort: getAllShortWeekdayNames(i18nGlobal.t),
        weekdaysMin: getAllMinWeekdayNames(i18nGlobal.t),
        meridiem: function (hours) {
            if (isPM(hours)) {
                return i18nGlobal.t("datetime.PM.content");
            } else {
                return i18nGlobal.t("datetime.AM.content");
            }
        },
    });
    services.setLocale(locale);
    document.querySelector("html").setAttribute("lang", locale);

    const defaultCurrency = getDefaultCurrency(i18nGlobal.t);
    const defaultFirstDayOfWeekName = getDefaultFirstDayOfWeek(i18nGlobal.t);
    let defaultFirstDayOfWeek = datetimeConstants.defaultFirstDayOfWeek;

    if (datetimeConstants.allWeekDays[defaultFirstDayOfWeekName]) {
        defaultFirstDayOfWeek =
            datetimeConstants.allWeekDays[defaultFirstDayOfWeekName].type;
    }

    return {
        defaultCurrency: defaultCurrency,
        defaultFirstDayOfWeek: defaultFirstDayOfWeek,
    };
}

function setTimeZone(timezone) {
    if (timezone) {
        dayjs.tz.setDefault(timezone);
    } else {
        dayjs.tz.setDefault();
    }
}

function initLocale(i18nGlobal, lastUserLanguage, timezone) {
    let localeDefaultSettings = null;

    if (lastUserLanguage && getLanguageInfo(lastUserLanguage)) {
        logger.info(`Last user language is ${lastUserLanguage}`);
        localeDefaultSettings = setLanguage(i18nGlobal, lastUserLanguage, true);
    } else {
        localeDefaultSettings = setLanguage(i18nGlobal, null, true);
    }

    if (timezone) {
        logger.info(`Current timezone is ${timezone}`);
        setTimeZone(timezone);
    } else {
        logger.info(
            `No timezone is set, use browser default ${getTimezoneOffset()} (maybe ${dayjs.tz.guess(
                true
            )})`
        );
    }

    return localeDefaultSettings;
}

export function getI18nOptions() {
    return {
        legacy: true,
        locale: defaultLanguage,
        fallbackLocale: defaultLanguage,
        formatFallbackMessages: true,
        messages: (function () {
            const messages = {};

            for (let locale in allLanguages) {
                if (
                    !Object.prototype.hasOwnProperty.call(allLanguages, locale)
                ) {
                    continue;
                }

                const lang = allLanguages[locale];
                messages[locale] = lang.content;
            }

            return messages;
        })(),
    };
}

export function translateIf(text, isTranslate, translateFn) {
    if (isTranslate) {
        return translateFn(text);
    }

    return text;
}

export function translateError(message, translateFn) {
    let parameters = {};

    if (message && message.error) {
        const localizedError = getLocalizedError(message.error);
        message = localizedError.message;
        parameters = getLocalizedErrorParameters(
            localizedError.parameters,
            translateFn
        );
    }

    return translateFn(message, parameters);
}

export function i18nFunctions(i18nGlobal) {
    return {
        getAllLanguageInfos: getAllLanguageInfos,
        getAllLanguageInfoArray: (includeSystemDefault) =>
            getAllLanguageInfoArray(i18nGlobal.t, includeSystemDefault),
        getLanguageInfo: getLanguageInfo,
        getDefaultLanguage: getDefaultLanguage,
        getCurrentLanguageCode: () => getCurrentLanguageCode(i18nGlobal),
        getCurrentLanguageInfo: () => getCurrentLanguageInfo(i18nGlobal),
        getCurrentLanguageDisplayName: () =>
            getCurrentLanguageDisplayName(i18nGlobal),
        getDefaultCurrency: () => getDefaultCurrency(i18nGlobal.t),
        getDefaultFirstDayOfWeek: () => getDefaultFirstDayOfWeek(i18nGlobal.t),
        getCurrencyName: (currencyCode) =>
            getCurrencyName(currencyCode, i18nGlobal.t),
        getAllMeridiemIndicatorNames: () =>
            getAllMeridiemIndicatorNames(i18nGlobal.t),
        getAllLongMonthNames: () => getAllLongMonthNames(i18nGlobal.t),
        getAllShortMonthNames: () => getAllShortMonthNames(i18nGlobal.t),
        getAllLongWeekdayNames: () => getAllLongWeekdayNames(i18nGlobal.t),
        getAllShortWeekdayNames: () => getAllShortWeekdayNames(i18nGlobal.t),
        getAllMinWeekdayNames: () => getAllMinWeekdayNames(i18nGlobal.t),
        getAllLongDateFormats: () => getAllLongDateFormats(i18nGlobal.t),
        getAllShortDateFormats: () => getAllShortDateFormats(i18nGlobal.t),
        getAllLongTimeFormats: () => getAllLongTimeFormats(i18nGlobal.t),
        getAllShortTimeFormats: () => getAllShortTimeFormats(i18nGlobal.t),
        getMonthShortName: (month) => getMonthShortName(month, i18nGlobal.t),
        getMonthLongName: (month) => getMonthLongName(month, i18nGlobal.t),
        getWeekdayShortName: (weekDay) =>
            getWeekdayShortName(weekDay, i18nGlobal.t),
        getWeekdayLongName: (weekDay) =>
            getWeekdayLongName(weekDay, i18nGlobal.t),
        formatUnixTimeToLongDateTime: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongDateFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                ) +
                    " " +
                    getI18nLongTimeFormat(
                        i18nGlobal.t,
                        userStore.currentUserLongTimeFormat
                    ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortDateTime: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortDateFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                ) +
                    " " +
                    getI18nShortTimeFormat(
                        i18nGlobal.t,
                        userStore.currentUserShortTimeFormat
                    ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToLongDate: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongDateFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortDate: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortDateFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToLongYear: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongYearFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortYear: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortYearFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToLongYearMonth: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongYearMonthFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortYearMonth: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortYearMonthFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToLongMonthDay: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongMonthDayFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortMonthDay: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortMonthDayFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToLongTime: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nLongTimeFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongTimeFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatUnixTimeToShortTime: (
            userStore,
            unixTime,
            utcOffset,
            currentUtcOffset
        ) =>
            formatUnixTime(
                unixTime,
                getI18nShortTimeFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortTimeFormat
                ),
                utcOffset,
                currentUtcOffset
            ),
        formatTimeToLongYearMonth: (userStore, dateTime) =>
            formatTime(
                dateTime,
                getI18nLongYearMonthFormat(
                    i18nGlobal.t,
                    userStore.currentUserLongDateFormat
                )
            ),
        formatTimeToShortYearMonth: (userStore, dateTime) =>
            formatTime(
                dateTime,
                getI18nShortYearMonthFormat(
                    i18nGlobal.t,
                    userStore.currentUserShortDateFormat
                )
            ),
        isLongDateMonthAfterYear: (userStore) =>
            isLongDateMonthAfterYear(
                i18nGlobal.t,
                userStore.currentUserLongDateFormat
            ),
        isShortDateMonthAfterYear: (userStore) =>
            isShortDateMonthAfterYear(
                i18nGlobal.t,
                userStore.currentUserShortDateFormat
            ),
        isLongTime24HourFormat: (userStore) =>
            isLongTime24HourFormat(
                i18nGlobal.t,
                userStore.currentUserLongTimeFormat
            ),
        isLongTimeMeridiemIndicatorFirst: (userStore) =>
            isLongTimeMeridiemIndicatorFirst(
                i18nGlobal.t,
                userStore.currentUserLongTimeFormat
            ),
        isShortTime24HourFormat: (userStore) =>
            isShortTime24HourFormat(
                i18nGlobal.t,
                userStore.currentUserShortTimeFormat
            ),
        isShortTimeMeridiemIndicatorFirst: (userStore) =>
            isShortTimeMeridiemIndicatorFirst(
                i18nGlobal.t,
                userStore.currentUserShortTimeFormat
            ),
        getAllTimezones: (includeSystemDefault) =>
            getAllTimezones(includeSystemDefault, i18nGlobal.t),
        getTimezoneDifferenceDisplayText: (utcOffset) =>
            getTimezoneDifferenceDisplayText(utcOffset, i18nGlobal.t),
        getAllCurrencies: () => getAllCurrencies(i18nGlobal.t),
        getAllWeekDays: () => getAllWeekDays(i18nGlobal.t),
        getAllDateRanges: (scene, includeCustom) =>
            getAllDateRanges(scene, includeCustom, i18nGlobal.t),
        getAllRecentMonthDateRanges: (userStore, includeAll, includeCustom) =>
            getAllRecentMonthDateRanges(
                userStore,
                includeAll,
                includeCustom,
                i18nGlobal.t
            ),
        getDateRangeDisplayName: (userStore, dateType, startTime, endTime) =>
            getDateRangeDisplayName(
                userStore,
                dateType,
                startTime,
                endTime,
                i18nGlobal.t
            ),
        getAllTimezoneTypesUsedForStatistics: (currentTimezone) =>
            getAllTimezoneTypesUsedForStatistics(currentTimezone, i18nGlobal.t),
        getAllDecimalSeparators: () => getAllDecimalSeparators(i18nGlobal.t),
        getAllDigitGroupingSymbols: () =>
            getAllDigitGroupingSymbols(i18nGlobal.t),
        getAllDigitGroupingTypes: () => getAllDigitGroupingTypes(i18nGlobal.t),
        getAllCurrencyDisplayTypes: (settingsStore, userStore) =>
            getAllCurrencyDisplayTypes(userStore, settingsStore, i18nGlobal.t),
        getCurrentDecimalSeparator: (userStore) =>
            getCurrentDecimalSeparator(
                i18nGlobal.t,
                userStore.currentUserDecimalSeparator
            ),
        getCurrentDigitGroupingSymbol: (userStore) =>
            getCurrentDigitGroupingSymbol(
                i18nGlobal.t,
                userStore.currentUserDigitGroupingSymbol
            ),
        getCurrentDigitGroupingType: (userStore) =>
            getCurrentDigitGroupingType(
                i18nGlobal.t,
                userStore.currentUserDigitGrouping
            ),
        appendDigitGroupingSymbol: (userStore, value) =>
            getNumberWithDigitGroupingSymbol(value, i18nGlobal.t, userStore),
        parseAmount: (userStore, value) =>
            getParsedAmountNumber(value, i18nGlobal.t, userStore),
        formatAmount: (userStore, value) =>
            getFormatedAmount(value, i18nGlobal.t, userStore),
        formatAmountWithCurrency: (
            settingsStore,
            userStore,
            value,
            currencyCode
        ) =>
            getFormatedAmountWithCurrency(
                value,
                currencyCode,
                i18nGlobal.t,
                userStore,
                settingsStore
            ),
        formatExchangeRateAmount: (userStore, value) =>
            getFormatedExchangeRateAmount(value, i18nGlobal.t, userStore),
        getAdaptiveAmountRate: (
            userStore,
            amount1,
            amount2,
            fromExchangeRate,
            toExchangeRate
        ) =>
            getAdaptiveAmountRate(
                amount1,
                amount2,
                fromExchangeRate,
                toExchangeRate,
                i18nGlobal.t,
                userStore
            ),
        getAmountPrependAndAppendText: (
            settingsStore,
            userStore,
            currencyCode
        ) =>
            getAmountPrependAndAppendText(
                currencyCode,
                i18nGlobal.t,
                userStore,
                settingsStore
            ),
        getAllAccountCategories: () => getAllAccountCategories(i18nGlobal.t),
        getAllAccountTypes: () => getAllAccountTypes(i18nGlobal.t),
        getAllCategoricalChartTypes: () =>
            getAllCategoricalChartTypes(i18nGlobal.t),
        getAllTrendChartTypes: () => getAllTrendChartTypes(i18nGlobal.t),
        getAllStatisticsChartDataTypes: () =>
            getAllStatisticsChartDataTypes(i18nGlobal.t),
        getAllStatisticsSortingTypes: () =>
            getAllStatisticsSortingTypes(i18nGlobal.t),
        getAllTransactionEditScopeTypes: () =>
            getAllTransactionEditScopeTypes(i18nGlobal.t),
        getAllTransactionDefaultCategories: (categoryType, locale) =>
            getAllTransactionDefaultCategories(
                categoryType,
                locale,
                i18nGlobal.t
            ),
        getAllDisplayExchangeRates: (exchangeRatesData) =>
            getAllDisplayExchangeRates(exchangeRatesData, i18nGlobal.t),
        getEnableDisableOptions: () => getEnableDisableOptions(i18nGlobal.t),
        getCategorizedAccountsWithDisplayBalance: (
            allVisibleAccounts,
            showAccountBalance,
            defaultCurrency,
            settingsStore,
            userStore,
            exchangeRatesStore
        ) =>
            getCategorizedAccountsWithDisplayBalance(
                allVisibleAccounts,
                showAccountBalance,
                defaultCurrency,
                userStore,
                settingsStore,
                exchangeRatesStore,
                i18nGlobal.t
            ),
        joinMultiText: (textArray) => joinMultiText(textArray, i18nGlobal.t),
        setLanguage: (locale, force) => setLanguage(i18nGlobal, locale, force),
        setTimeZone: (timezone) => setTimeZone(timezone),
        initLocale: (lastUserLanguage, timezone) =>
            initLocale(i18nGlobal, lastUserLanguage, timezone),
    };
}
