<template>
  <f7-page @page:afterin="onPageAfterIn">
    <f7-navbar>
      <f7-nav-left :back-link="$t('Back')"></f7-nav-left>
      <f7-nav-title :title="$t('Currency Settings')"></f7-nav-title>
      <f7-nav-right> </f7-nav-right>
    </f7-navbar>

    <f7-list strong inset dividers class="margin-vertical">
      <f7-list-item>
        <span>{{ $t("Show Account Balance") }}</span>
        <f7-toggle :checked="showAccountBalance" @toggle:change="showAccountBalance = $event"></f7-toggle>
      </f7-list-item>
      <f7-list-item>
        <span>{{ $t("Enable Thousands Separator") }}</span>
        <f7-toggle :checked="isEnableThousandsSeparator" @toggle:change="isEnableThousandsSeparator = $event"></f7-toggle>
      </f7-list-item>
      <f7-list-item>
        <span>{{ $t("Enable Decimal Point") }}</span>
        <f7-toggle :checked="isEnableDecimalPoint" @toggle:change="isEnableDecimalPoint = $event"></f7-toggle>
      </f7-list-item>
      <f7-list-item>
        <span>{{ $t("Enable Autocomplete Thousand") }}</span>
        <f7-toggle :checked="isEnableAutocompleteThousand" @toggle:change="isEnableAutocompleteThousand = $event"></f7-toggle>
      </f7-list-item>

      <f7-list-item
        :key="currentLocale + '_currency_display'"
        :title="$t('Currency Display Mode')"
        smart-select
        :smart-select-params="{
          openIn: 'popup',
          popupPush: true,
          closeOnSelect: true,
          scrollToSelectedItem: true,
          searchbar: true,
          searchbarPlaceholder: $t('Currency Display Mode'),
          searchbarDisableText: $t('Cancel'),
          appendSearchbarNotFound: $t('No results'),
          popupCloseLinkText: $t('Done'),
        }"
      >
        <select v-model="currencyDisplayMode">
          <option :value="allCurrencyDisplayModes.None">{{ $t("None") }}</option>
          <option :value="allCurrencyDisplayModes.Symbol">{{ $t("Currency Symbol") }}</option>
          <option :value="allCurrencyDisplayModes.Code">{{ $t("Currency Code") }}</option>
          <option :value="allCurrencyDisplayModes.Name">{{ $t("Currency Name") }}</option>
        </select>
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { mapStores } from "pinia";
import { useRootStore } from "@/stores/index.js";
import { useSettingsStore } from "@/stores/setting.js";
import currencyConstants from "@/consts/currency.js";

export default {
  data() {
    const self = this;
    return {
      currentLocale: self.$locale.getCurrentLanguageCode(),
    };
  },
  computed: {
    ...mapStores(useRootStore, useSettingsStore),
    allCurrencyDisplayModes() {
      return currencyConstants.allCurrencyDisplayModes;
    },
    showAccountBalance: {
      get: function () {
        return this.settingsStore.appSettings.showAccountBalance;
      },
      set: function (value) {
        this.settingsStore.setShowAccountBalance(value);
      },
    },
    isEnableThousandsSeparator: {
      get: function () {
        return this.settingsStore.appSettings.thousandsSeparator;
      },
      set: function (value) {
        this.settingsStore.setEnableThousandsSeparator(value);
      },
    },
    isEnableDecimalPoint: {
      get: function () {
        return this.settingsStore.appSettings.decimalPoint;
      },
      set: function (value) {
        if (value !== this.settingsStore.appSettings.decimalPoint) {
          this.settingsStore.setEnableDecimalPoint(value);
        }
      },
    },
    isEnableAutocompleteThousand: {
      get: function () {
        return this.settingsStore.appSettings.autocompleteThousand;
      },
      set: function (value) {
        if (value !== this.settingsStore.appSettings.autocompleteThousand) {
          this.settingsStore.setEnableAutocompleteThousand(value);
        }
      },
    },
    currencyDisplayMode: {
      get: function () {
        return this.settingsStore.appSettings.currencyDisplayMode;
      },
      set: function (value) {
        this.settingsStore.setCurrencyDisplayMode(value);
      },
    },
  },
  methods: {
    onPageAfterIn() {
      this.currentLocale = this.$locale.getCurrentLanguageCode();
    },
  },
};
</script>