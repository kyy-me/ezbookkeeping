import currencyConstants from "@/consts/currency.js";

import { isString, isNumber } from "./common.js";

export function numericCurrencyToString(
    num,
    enableThousandsSeparator,
    enableDecimalPoint,
    trimTailZero
) {
    let str = num.toString();
    const negative = str.charAt(0) === "-";

    if (negative) {
        str = str.substring(1);
    }

    let integer = "0";
    let decimals = "00";

    if (str.length > 2) {
        integer = str.substring(0, str.length - 2);
        decimals = str.substring(str.length - 2);
    } else if (str.length === 2) {
        decimals = str;
    } else if (str.length === 1) {
        decimals = "0" + str;
    }

    if (trimTailZero) {
        if (decimals.charAt(0) === "0" && decimals.charAt(1) === "0") {
            decimals = "";
        } else if (decimals.charAt(0) !== "0" && decimals.charAt(1) === "0") {
            decimals = decimals.charAt(0);
        }
    }

    integer = appendThousandsSeparator(integer, enableThousandsSeparator);

    if (decimals !== "" && enableDecimalPoint) {
        str = `${integer}.${decimals}`;
    } else {
        str = integer;
    }

    if (negative) {
        str = `-${str}`;
    }

    return str;
}

export function stringCurrencyToNumeric(str) {
    if (!str || str.length < 1) {
        return 0;
    }

    const negative = str.charAt(0) === "-";

    if (negative) {
        str = str.substring(1);
    }

    if (!str || str.length < 1) {
        return 0;
    }

    const sign = negative ? -1 : 1;

    if (str.indexOf(",")) {
        str = str.replaceAll(/,/g, "");
    }

    let dotPos = str.indexOf(".");

    if (dotPos < 0) {
        return sign * parseInt(str) * 100;
    } else if (dotPos === 0) {
        str = "0" + str;
        dotPos++;
    }

    const integer = str.substring(0, dotPos);
    const decimals = str.substring(dotPos + 1, str.length);

    if (decimals.length < 1) {
        return sign * parseInt(integer) * 100;
    } else if (decimals.length === 1) {
        return sign * parseInt(integer) * 100 + sign * parseInt(decimals) * 10;
    } else if (decimals.length === 2) {
        return sign * parseInt(integer) * 100 + sign * parseInt(decimals);
    } else {
        return (
            sign * parseInt(integer) * 100 +
            sign * parseInt(decimals.substring(0, 2))
        );
    }
}

export function getExchangedAmount(amount, fromRate, toRate) {
    const exchangeRate = parseFloat(toRate) / parseFloat(fromRate);

    if (!isNumber(exchangeRate)) {
        return null;
    }

    return amount * exchangeRate;
}

export function getConvertedAmount(
    baseAmount,
    fromExchangeRate,
    toExchangeRate
) {
    if (!fromExchangeRate || !toExchangeRate) {
        return "";
    }

    if (baseAmount === "") {
        return 0;
    }

    return getExchangedAmount(
        baseAmount,
        fromExchangeRate.rate,
        toExchangeRate.rate
    );
}

export function getDisplayExchangeRateAmount(
    rateStr,
    isEnableThousandsSeparator
) {
    if (rateStr.indexOf(".") < 0) {
        return appendThousandsSeparator(rateStr, isEnableThousandsSeparator);
    } else {
        let firstNonZeroPos = 0;

        for (let i = 0; i < rateStr.length; i++) {
            if (rateStr.charAt(i) !== "." && rateStr.charAt(i) !== "0") {
                firstNonZeroPos = Math.min(i + 4, rateStr.length);
                break;
            }
        }

        const trimmedRateStr = rateStr.substring(
            0,
            Math.max(6, Math.max(firstNonZeroPos, rateStr.indexOf(".") + 2))
        );
        return appendThousandsSeparator(
            trimmedRateStr,
            isEnableThousandsSeparator
        );
    }
}

export function getAdaptiveDisplayAmountRate(
    amount1,
    amount2,
    fromExchangeRate,
    toExchangeRate,
    isEnableThousandsSeparator
) {
    if (!amount1 || !amount2 || amount1 === amount2) {
        if (
            !fromExchangeRate ||
            !fromExchangeRate.rate ||
            !toExchangeRate ||
            !toExchangeRate.rate
        ) {
            return null;
        }

        amount1 = fromExchangeRate.rate;
        amount2 = toExchangeRate.rate;
    }

    amount1 = parseFloat(amount1);
    amount2 = parseFloat(amount2);

    if (amount1 > amount2) {
        const rateStr = (amount1 / amount2).toString();
        const displayRateStr = getDisplayExchangeRateAmount(
            rateStr,
            isEnableThousandsSeparator
        );
        return `${displayRateStr} : 1`;
    } else {
        const rateStr = (amount2 / amount1).toString();
        const displayRateStr = getDisplayExchangeRateAmount(
            rateStr,
            isEnableThousandsSeparator
        );
        return `1 : ${displayRateStr}`;
    }
}

export function appendThousandsSeparator(value, enable) {
    if (!enable || value.length <= 3) {
        return value;
    }

    const negative = value.charAt(0) === "-";

    if (negative) {
        value = value.substring(1);
    }

    const dotPos = value.indexOf(".");
    const integer = dotPos < 0 ? value : value.substring(0, dotPos);
    const decimals =
        dotPos < 0 ? "" : value.substring(dotPos + 1, value.length);

    const finalChars = [];

    for (let i = 0; i < integer.length; i++) {
        if (i % 3 === 0 && i > 0) {
            finalChars.push(",");
        }

        finalChars.push(integer.charAt(integer.length - 1 - i));
    }

    finalChars.reverse();

    let newInteger = finalChars.join("");

    if (negative) {
        newInteger = `-${newInteger}`;
    }

    if (dotPos < 0) {
        return newInteger;
    } else {
        return `${newInteger}.${decimals}`;
    }
}

export function formatPercent(value, precision, lowPrecisionValue) {
    const ratio = Math.pow(10, precision);
    const normalizedValue = Math.floor(value * ratio);

    if (value > 0 && normalizedValue < 1 && lowPrecisionValue) {
        return lowPrecisionValue + "%";
    }

    const result = normalizedValue / ratio;
    return result + "%";
}

export function appendCurrencySymbol(
    value,
    currencyDisplayType,
    currencyCode,
    currencyName
) {
    if (!currencyDisplayType) {
        return value;
    }

    if (isNumber(value)) {
        value = value.toString();
    }

    if (!isString(value)) {
        return value;
    }

    let symbol = "";
    let separator = currencyDisplayType.separator || "";

    if (
        currencyDisplayType.symbol ===
        currencyConstants.allCurrencyDisplaySymbol.Symbol
    ) {
        const currencyInfo = currencyConstants.all[currencyCode];

        if (currencyInfo && currencyInfo.symbol) {
            symbol = currencyInfo.symbol;
        } else if (currencyInfo && currencyInfo.code) {
            symbol = currencyInfo.code;
        }

        if (!symbol) {
            symbol = currencyConstants.defaultCurrencySymbol;
        }
    } else if (
        currencyDisplayType.symbol ===
        currencyConstants.allCurrencyDisplaySymbol.Code
    ) {
        symbol = currencyCode;
    } else if (
        currencyDisplayType.symbol ===
        currencyConstants.allCurrencyDisplaySymbol.Name
    ) {
        symbol = currencyName;
    }

    if (
        currencyDisplayType.location ===
        currencyConstants.allCurrencyDisplayLocation.BeforeAmount
    ) {
        return `${symbol}${separator}${value}`;
    } else if (
        currencyDisplayType.location ===
        currencyConstants.allCurrencyDisplayLocation.AfterAmount
    ) {
        return `${value}${separator}${symbol}`;
    } else {
        return value;
    }
}
