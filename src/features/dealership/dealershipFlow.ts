import type { FlowDefinition } from '../flows/types';
import { anything, mobileNumber, required, sanitizeMobile } from '../flows/validation';

export type DealershipKey = 'name' | 'business' | 'existing' | 'experience' | 'state' | 'city' | 'mobile';

const YES_NO = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
] as const;

const orNotProvided = (value: string): string => value.trim() || 'Not provided';

export const dealershipFlow: FlowDefinition<DealershipKey> = {
  id: 'dealer',
  title: 'Become a Gravton Dealer',
  subtitle: 'Tell us a little about yourself.',
  initialValues: { name: '', business: '', existing: '', experience: '', state: '', city: '', mobile: '' },
  steps: [
    {
      key: 'name',
      label: 'Name',
      question: 'What is your name?',
      kind: 'text',
      placeholder: 'Your name',
      validate: required('Please enter your name.'),
    },
    {
      key: 'business',
      label: 'Current Business / Occupation',
      question: 'What do you currently do? (optional)',
      kind: 'text',
      placeholder: 'Business / occupation',
      optional: true,
      validate: anything,
      display: orNotProvided,
    },
    {
      key: 'existing',
      label: 'Currently Owned Dealership?',
      question: 'Do you currently own a dealership?',
      kind: 'yesno',
      options: YES_NO,
      validate: required('Please select whether you currently own a dealership.'),
    },
    {
      key: 'experience',
      label: 'Automobile Experience',
      question: 'How much automobile experience do you have? (optional)',
      kind: 'text',
      placeholder: 'e.g. 5 years',
      optional: true,
      validate: anything,
      display: orNotProvided,
    },
    {
      key: 'state',
      label: 'State',
      question: 'Which state are you in?',
      kind: 'text',
      placeholder: 'Your state',
      validate: required('Please enter your state.'),
    },
    {
      key: 'city',
      label: 'City / District',
      question: 'Which city or district?',
      kind: 'text',
      placeholder: 'City / district',
      validate: required('Please enter your city or district.'),
    },
    {
      key: 'mobile',
      label: 'Mobile Number',
      question: 'What is your 10-digit mobile number?',
      kind: 'tel',
      placeholder: '10-digit mobile number',
      sanitize: sanitizeMobile,
      validate: mobileNumber,
    },
  ],
  buildMessage: (v) =>
    `Hello Gravton,\n\nI am interested in becoming a Gravton dealer.\n\nName: ${v.name.trim()}\nCurrent Business / Occupation: ${orNotProvided(v.business)}\nCurrently Owned Dealership: ${v.existing}\nAutomobile Experience: ${orNotProvided(v.experience)}\nState: ${v.state.trim()}\nCity / District: ${v.city.trim()}\nMobile: ${v.mobile.trim()}\n\nPlease share the dealership requirements and next steps.`,
};
