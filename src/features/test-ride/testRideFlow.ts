import { RIDE_MODEL_OPTIONS } from '../../data/quanta';
import type { FlowDefinition } from '../flows/types';
import { anything, dateNotInPast, formatDate, mobileNumber, required, sanitizeMobile } from '../flows/validation';

export type TestRideKey = 'model' | 'name' | 'mobile' | 'location' | 'date';

export const testRideFlow: FlowDefinition<TestRideKey> = {
  id: 'test',
  title: 'Book a Test Ride',
  subtitle: 'Experience Quanta S+ for yourself.',
  initialValues: { model: 'Quanta S+', name: '', mobile: '', location: '', date: '' },
  steps: [
    {
      key: 'model',
      label: 'Model',
      question: 'Which model would you like to ride?',
      kind: 'yesno',
      options: RIDE_MODEL_OPTIONS,
      validate: anything,
    },
    {
      key: 'name',
      label: 'Name',
      question: 'What is your name?',
      kind: 'text',
      placeholder: 'Your name',
      validate: required('Please enter your name.'),
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
    {
      key: 'location',
      label: 'Preferred Location',
      question: 'Where would you like to take the test ride?',
      kind: 'text',
      placeholder: 'City / Area',
      validate: required('Please enter your preferred location.'),
    },
    {
      key: 'date',
      label: 'Preferred Date',
      question: 'Which day suits you?',
      kind: 'date',
      validate: dateNotInPast(),
      display: formatDate,
    },
  ],
  buildMessage: (v) =>
    `Hello Gravton,\n\nI would like to book a test ride.\n\nName: ${v.name.trim()}\nMobile: ${v.mobile.trim()}\nModel: ${v.model}\nPreferred Location: ${v.location.trim()}\nPreferred Date: ${formatDate(v.date)}\n\nPlease help me schedule the test ride.`,
};
