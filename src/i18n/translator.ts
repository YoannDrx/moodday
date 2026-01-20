import type { Messages } from "./messages";

export type TranslationValues = Record<string, string | number | undefined>;

const getMessageByPath = (messages: Messages, path: string) => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (
      acc &&
      typeof acc === "object" &&
      key in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, messages);
};

const formatMessage = (message: string, values?: TranslationValues) => {
  if (values === undefined) {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) {
      return `{${key}}`;
    }
    return String(value);
  });
};

export const createTranslator = (messages: Messages) => {
  return (key: string, values?: TranslationValues) => {
    const message = getMessageByPath(messages, key);
    if (typeof message !== "string") {
      return key;
    }

    return formatMessage(message, values);
  };
};

export const getMessage = <T = unknown>(
  messages: Messages,
  key: string,
): T | undefined => {
  return getMessageByPath(messages, key) as T | undefined;
};
