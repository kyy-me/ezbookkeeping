const allAccountCategories = [
    {
        id: 1,
        name: 'Cash',
        defaultAccountIconId: '1'
    },
    {
        id: 2,
        name: 'Debit Card',
        defaultAccountIconId: '100'
    },
    {
        id: 3,
        name: 'Credit Card',
        defaultAccountIconId: '100'
    },
    {
        id: 4,
        name: 'Virtual Account',
        defaultAccountIconId: '500'
    },
    {
        id: 5,
        name: 'Debt Account',
        defaultAccountIconId: '600'
    },
    {
        id: 6,
        name: 'Receivables',
        defaultAccountIconId: '700'
    },
    {
        id: 7,
        name: 'Investment Account',
        defaultAccountIconId: '800'
    },
    {
        id: 8,
        name: "Saving Account",
        defaultAccountIconId: "30",
    },
];

const allAccountTypes = {
    SingleAccount: 1,
    MultiSubAccounts: 2
};
const allAccountTypesArray = [
    {
        id: allAccountTypes.SingleAccount,
        name: 'Single Account'
    }, {
        id: allAccountTypes.MultiSubAccounts,
        name: 'Multiple Sub-accounts'
    }
];

export default {
    allCategories: allAccountCategories,
    allAccountTypes: allAccountTypes,
    allAccountTypesArray: allAccountTypesArray,
};

export const ACCOUNT_CATEGORY_CASH = 1;
export const ACCOUNT_CATEGORY_DEBIT_CARD = 2;
export const ACCOUNT_CATEGORY_CREDIT_CARD = 3;
export const ACCOUNT_CATEGORY_VIRTUAL = 4;
export const ACCOUNT_CATEGORY_DEBT = 5;
export const ACCOUNT_CATEGORY_RECEIVABLES = 6;
export const ACCOUNT_CATEGORY_INVESTMENT = 7;
export const ACCOUNT_CATEGORY_SAVING = 8;