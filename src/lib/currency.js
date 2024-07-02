import currencyConstants from '@/consts/currency.js';

import { isString, isNumber } from './common.js';

export function appendCurrencySymbol(value, currencyDisplayType, currencyCode, currencyName) {
    if (isNumber(value)) {
        value = value.toString();
    }

    if (!isString(value)) {
        return value;
    }

    const symbol = getAmountPrependAndAppendCurrencySymbol(currencyDisplayType, currencyCode, currencyName);

    if (!symbol) {
        return value;
    }

    const separator = currencyDisplayType.separator || '';

    if (symbol.prependText) {
        value = symbol.prependText + separator + value;
    }

    if (symbol.appendText) {
        value = value + separator + symbol.appendText;
    }

    return value;
}

export function getAmountPrependAndAppendCurrencySymbol(currencyDisplayType, currencyCode, currencyName) {
    if (!currencyDisplayType) {
        return null;
    }

    let symbol = '';

    if (currencyDisplayType.symbol === currencyConstants.allCurrencyDisplaySymbol.Symbol) {
        const currencyInfo = currencyConstants.all[currencyCode];

        if (currencyInfo && currencyInfo.symbol) {
            symbol = currencyInfo.symbol;
        }

        if (!symbol) {
            symbol = currencyConstants.defaultCurrencySymbol;
        }
    } else if (currencyDisplayType.symbol === currencyConstants.allCurrencyDisplaySymbol.Code) {
        symbol = currencyCode;
    }else if (currencyDisplayType.symbol === currencyConstants.allCurrencyDisplaySymbol.Name) {
        symbol = currencyName;
    }

    if (currencyDisplayType.location === currencyConstants.allCurrencyDisplayLocation.BeforeAmount) {
        return {
            prependText: symbol
        };
    } else if (currencyDisplayType.location === currencyConstants.allCurrencyDisplayLocation.AfterAmount) {
        return {
            appendText: symbol
        };
    } else {
        return null;
    }
}
