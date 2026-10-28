import { SHOWROOM_MODEL_OPTIONS } from '../../data/quanta';
import type { FlowDefinition } from '../flows/types';
import { anything, mobileNumber, required, sanitizeMobile } from '../flows/validation';

export type ShowroomKey = 'name' | 'mobile' | 'location' | 'model';

export const showroomFlow: FlowDefinition<ShowroomKey> = {
  id: 'showroom',
  title: 'Find a Showroom',
  subtitle: "Tell us where you are and we'll help you find the nearest Gravton showroom.",
  initialValues: { name: '', mobile: '', location: '', model: 'Quanta S+' },
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
      label: 'City / Location',
      question: 'Which city or area are you in?',
      kind: 'text',
      placeholder: 'City / Area',
      validate: required('Please enter your city or location.'),
    },
    {
      key: 'model',
      label: 'Interested In',
      question: 'Which model are you interested in?',
      kind: 'select',
      options: SHOWROOM_MODEL_OPTIONS,
      validate: anything,
    },
  ],
  buildMessage: (v) =>
    `Hello Gravton,\n\nI would like to find a Gravton showroom.\n\nName: ${v.name.trim()}\nMobile: ${v.mobile.trim()}\nCity / Location: ${v.location.trim()}\nInterested In: ${v.model}\n\nPlease help me with the nearest Gravton showroom.`,
};
