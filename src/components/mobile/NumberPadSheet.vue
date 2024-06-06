<template>
    <f7-sheet
        swipe-to-close
        swipe-handler=".swipe-handler"
        class="numpad-sheet"
        style="height: auto"
        :opened="show"
        @sheet:open="onSheetOpen"
        @sheet:closed="onSheetClosed"
    >
        <div class="swipe-handler" style="z-index: 10"></div>
        <f7-page-content class="margin-top no-padding-top">
            <div class="numpad-values">
                <span class="numpad-value" :class="currentDisplayNumClass">{{
                    currentDisplay
                }}</span>
            </div>
            <div class="numpad-buttons">
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(7)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >7</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(8)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >8</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(9)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >9</span
                    >
                </f7-button>
                <f7-button
                    v-if:="currentDisplay"
                    class="numpad-button numpad-button-function no-right-border"
                    @click="clear"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >&times;</span
                    >
                </f7-button>
                <f7-button
                    v-if:="!currentDisplay"
                    class="numpad-button numpad-button-function no-right-border"
                    @click="paste"
                >
                    <span class="numpad-button-text numpad-button-text-normal">
                        <svg
                            class="numpad-button-text numpad-button-text-normal"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                            height="26"
                            width="26"
                            viewBox="0 0 512 512"
                        >
                            <path
                                d="M104.6 48H64C28.7 48 0 76.7 0 112V384c0 35.3 28.7 64 64 64h96V400H64c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H80c0 17.7 14.3 32 32 32h72.4C202 108.4 227.6 96 256 96h62c-7.1-27.6-32.2-48-62-48H215.4C211.6 20.9 188.2 0 160 0s-51.6 20.9-55.4 48zM144 56a16 16 0 1 1 32 0 16 16 0 1 1 -32 0zM448 464H256c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16l140.1 0L464 243.9V448c0 8.8-7.2 16-16 16zM256 512H448c35.3 0 64-28.7 64-64V243.9c0-12.7-5.1-24.9-14.1-33.9l-67.9-67.9c-9-9-21.2-14.1-33.9-14.1H256c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64z"
                            />
                        </svg>
                    </span>
                </f7-button>

                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(4)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >4</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(5)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >5</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(6)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >6</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-function no-right-border"
                    @click="setSymbol('−')"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >&minus;</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(1)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >1</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(2)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >2</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(3)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >3</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-function no-right-border"
                    @click="setSymbol('+')"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >&plus;</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="inputNum(0)"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >0</span
                    >
                </f7-button>
                <f7-button
                    v-if="!isEnableAutocompleteThousand"
                    class="numpad-button numpad-button-num"
                    @click="inputDot()"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >.</span
                    >
                </f7-button>
                <f7-button
                    v-if="isEnableAutocompleteThousand"
                    class="numpad-button numpad-button-num"
                    @click="inputThousand()"
                >
                    <span class="numpad-button-text numpad-button-text-normal"
                        >000</span
                    >
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-num"
                    @click="backspace"
                    @taphold="clear()"
                >
                    <span class="numpad-button-text numpad-button-text-normal">
                        <f7-icon f7="delete_left"></f7-icon>
                    </span>
                </f7-button>
                <f7-button
                    class="numpad-button numpad-button-confirm no-right-border no-bottom-border"
                    fill
                    @click="confirm()"
                >
                    <span
                        :class="{
                            'numpad-button-text': true,
                            'numpad-button-text-confirm': !currentSymbol,
                        }"
                        >{{ confirmText }}</span
                    >
                </f7-button>
            </div>
        </f7-page-content>
    </f7-sheet>
</template>

<script>
import clipboardy from "clipboardy";
import { mapStores } from "pinia";
import { useSettingsStore } from "@/stores/setting.js";

import { isString, appendThousandsSeparator } from "@/lib/common.js";
import {
    numericCurrencyToString,
    stringCurrencyToNumeric,
} from "@/lib/currency.js";

export default {
    props: ["modelValue", "minValue", "maxValue", "show"],
    emits: ["update:modelValue", "update:show"],
    data() {
        const self = this;

        return {
            previousValue: "",
            currentSymbol: "",
            currentValue: self.getStringValue(self.modelValue),
        };
    },
    computed: {
        ...mapStores(useSettingsStore),
        isEnableThousandsSeparator() {
            return this.settingsStore.appSettings.thousandsSeparator;
        },
        isEnableAutocompleteThousand() {
            return this.settingsStore.appSettings.autocompleteThousand;
        },
        currentDisplay() {
            const previousValue = appendThousandsSeparator(
                this.previousValue,
                this.isEnableThousandsSeparator
            );
            const currentValue = appendThousandsSeparator(
                this.currentValue,
                this.isEnableThousandsSeparator
            );

            if (this.currentSymbol) {
                return `${previousValue} ${this.currentSymbol} ${currentValue}`;
            } else {
                return currentValue;
            }
        },
        currentDisplayNumClass() {
            const currentDisplay = this.currentDisplay || "";

            if (currentDisplay.length >= 24) {
                return "numpad-value-small";
            } else if (currentDisplay.length >= 16) {
                return "numpad-value-normal";
            } else {
                return "numpad-value-large";
            }
        },
        confirmText() {
            if (this.currentSymbol) {
                return "=";
            } else {
                return this.$t("OK");
            }
        },
    },
    methods: {
        getStringValue(value) {
            let str = numericCurrencyToString(
                value,
                this.isEnableThousandsSeparator
            );

            if (str.indexOf(",")) {
                str = str.replaceAll(/,/g, "");
            }

            const dotPos = str.indexOf(".");

            if (dotPos < 0) {
                if (str === "0") {
                    return "";
                }

                return str;
            }

            let integer = str.substring(0, dotPos);
            let decimals = str.substring(dotPos + 1, str.length);
            let newDecimals = "";

            for (let i = decimals.length - 1; i >= 0; i--) {
                if (decimals[i] !== "0" || newDecimals.length > 0) {
                    newDecimals = decimals[i] + newDecimals;
                }
            }

            if (newDecimals.length < 1) {
                if (integer === "0") {
                    return "";
                }

                return integer;
            }

            return `${integer}.${newDecimals}`;
        },
        inputNum(num) {
            if (!this.previousValue && this.currentSymbol === "−") {
                this.currentValue = "-" + this.currentValue;
                this.currentSymbol = "";
            }

            if (this.currentValue === "0") {
                this.currentValue = num.toString();
                return;
            } else if (this.currentValue === "-0") {
                this.currentValue = "-" + num.toString();
                return;
            }

            const dotPos = this.currentValue.indexOf(".");

            if (
                dotPos >= 0 &&
                this.currentValue.substring(
                    dotPos + 1,
                    this.currentValue.length
                ).length >= 2
            ) {
                return;
            }

            const newValue = this.currentValue + num.toString();

            if (isString(this.minValue) && this.minValue !== "") {
                const min = stringCurrencyToNumeric(this.minValue);
                const current = stringCurrencyToNumeric(newValue);

                if (current < min) {
                    return;
                }
            }

            if (isString(this.maxValue) && this.maxValue !== "") {
                const max = stringCurrencyToNumeric(this.maxValue);
                const current = stringCurrencyToNumeric(newValue);

                if (current > max) {
                    return;
                }
            }

            this.currentValue = newValue;
        },
        inputThousand() {
            if (this.currentValue <= 0) {
                return "0";
            }

            this.currentValue = this.currentValue + "000";
        },
        inputDot() {
            if (this.currentValue.indexOf(".") >= 0) {
                return;
            }

            if (!this.previousValue && this.currentSymbol === "−") {
                this.currentValue = "-" + this.currentValue;
                this.currentSymbol = "";
            }

            if (this.currentValue.length < 1) {
                this.currentValue = "0";
            } else if (this.currentValue === "-") {
                this.currentValue = "-0";
            }

            this.currentValue = this.currentValue + ".";
        },
        setSymbol(symbol) {
            if (this.currentValue) {
                if (this.currentSymbol) {
                    const lastFormulaCalcResult = this.confirm();

                    if (!lastFormulaCalcResult) {
                        return;
                    }
                }

                this.previousValue = this.currentValue;
                this.currentValue = "";
            }

            this.currentSymbol = symbol;
        },
        backspace() {
            if (!this.currentValue || this.currentValue.length < 1) {
                if (this.currentSymbol) {
                    this.currentValue = this.previousValue;
                    this.previousValue = "";
                    this.currentSymbol = "";
                }

                return;
            }

            this.currentValue = this.currentValue.substring(
                0,
                this.currentValue.length - 1
            );
        },
        paste() {
            clipboardy.read().then((value) => {
                const numbers = value.match(/\d/g);
                if (numbers) {
                    this.currentValue = numbers.join("");
                }
            });
        },
        clear() {
            this.currentValue = "";
            this.previousValue = "";
            this.currentSymbol = "";
        },
        confirm() {
            if (this.currentSymbol && this.currentValue.length >= 1) {
                const previousValue = stringCurrencyToNumeric(
                    this.previousValue
                );
                const currentValue = stringCurrencyToNumeric(this.currentValue);
                let finalValue = 0;

                switch (this.currentSymbol) {
                    case "+":
                        finalValue = previousValue + currentValue;
                        break;
                    case "−":
                        finalValue = previousValue - currentValue;
                        break;
                    case "×":
                        finalValue = Math.round(
                            (previousValue * currentValue) / 100
                        );
                        break;
                    default:
                        finalValue = previousValue;
                }

                if (isString(this.minValue) && this.minValue !== "") {
                    const min = stringCurrencyToNumeric(this.minValue);

                    if (finalValue < min) {
                        this.$toast("Numeric Overflow");
                        return false;
                    }
                }

                if (isString(this.maxValue) && this.maxValue !== "") {
                    const max = stringCurrencyToNumeric(this.maxValue);

                    if (finalValue > max) {
                        this.$toast("Numeric Overflow");
                        return false;
                    }
                }

                this.currentValue = this.getStringValue(finalValue);
                this.previousValue = "";
                this.currentSymbol = "";

                return true;
            } else if (this.currentSymbol && this.currentValue.length < 1) {
                this.currentValue = this.previousValue;
                this.previousValue = "";
                this.currentSymbol = "";

                return true;
            } else {
                if (
                    this.isEnableAutocompleteThousand &&
                    Number(this.currentValue) < 1000
                ) {
                    this.currentValue = `${this.currentValue}000`;
                }
                const value = stringCurrencyToNumeric(this.currentValue);

                this.$emit("update:modelValue", value);
                this.close();

                return true;
            }
        },
        close() {
            this.$emit("update:show", false);
        },
        onSheetOpen() {
            this.currentValue = this.getStringValue(this.modelValue);
        },
        onSheetClosed() {
            this.close();
        },
    },
};
</script>

<style>
.numpad-sheet {
    height: auto;
}

.numpad-values {
    border-bottom: 1px solid var(--f7-page-bg-color);
}

.numpad-value {
    display: flex;
    position: relative;
    padding-left: 16px;
    line-height: 1;
    height: var(--ebk-numpad-value-height);
    align-items: center;
    box-sizing: border-box;
    user-select: none;
}

.numpad-value-small {
    font-size: var(--ebk-numpad-value-small-font-size);
}

.numpad-value-normal {
    font-size: var(--ebk-numpad-value-normal-font-size);
}

.numpad-value-large {
    font-size: var(--ebk-numpad-value-large-font-size);
}

.numpad-buttons {
    display: flex;
    flex-wrap: wrap;
}

.numpad-button {
    display: flex;
    position: relative;
    text-align: center;
    border-radius: 0;
    border-right: 1px solid var(--f7-page-bg-color);
    border-bottom: 1px solid var(--f7-page-bg-color);
    height: 60px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    user-select: none;
    touch-action: none;
}

.numpad-button-num {
    width: calc(80% / 3);
}

.numpad-button-function,
.numpad-button-confirm {
    width: 20%;
}

.numpad-button-num.active-state,
.numpad-button-function.active-state {
    background-color: rgba(var(--f7-color-black-rgb), 0.15);
}

.numpad-button-text {
    display: block;
    font-size: var(--ebk-numpad-normal-button-font-size);
    font-weight: normal;
    line-height: 1;
}

.numpad-button-text-normal {
    color: var(--f7-color-black);
}

.dark .numpad-button-text-normal {
    color: var(--f7-color-white);
}

.numpad-button-text-confirm {
    font-size: var(--ebk-numpad-confirm-button-font-size);
}
</style>
