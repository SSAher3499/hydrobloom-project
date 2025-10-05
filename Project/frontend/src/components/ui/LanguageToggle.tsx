import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const LanguageToggle: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-neon-cyan hover:bg-dark-800 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 transition-all duration-200">
        <LanguageIcon className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-200">{currentLang.flag}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </Menu.Button>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-lg bg-dark-800 shadow-lg ring-1 ring-neon-cyan ring-opacity-25 border border-dark-700 focus:outline-none">
          <div className="py-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={clsx(
                      active ? 'bg-dark-700 text-neon-green' : 'text-gray-200',
                      currentLanguage === language.code ? 'bg-dark-700 text-neon-cyan' : '',
                      'flex items-center space-x-2 w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-150'
                    )}
                  >
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default LanguageToggle;