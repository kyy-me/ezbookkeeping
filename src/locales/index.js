import en from './en.js'
import vi from './vi.js';
import zhHans from './zh_Hans.js'

export const defaultLanguage = 'en';

export const allLanguages = {
    'vi': {
        name: 'Vietnamese',
        displayName: 'Tiếng Việt',
        code: 'vi',
        content: vi
    },
    'en': {
        name: 'English',
        displayName: 'English',
        code: 'en',
        content: en
    },
    'zh-Hans': {
        name: 'Simplified Chinese',
        displayName: '简体中文',
        code: 'zh-CN',
        aliases: ['zh-CHS', 'zh-CN', 'zh-SG'],
        content: zhHans
    }
};
