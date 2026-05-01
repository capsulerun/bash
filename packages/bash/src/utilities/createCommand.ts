import { CreateCustomCommand } from '@capsule-run/bash-types';

export const createCommand: CreateCustomCommand = (name, handler, manual) => {
  return { name, handler, manual };
};
