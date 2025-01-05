export const shareSupported = () => {
  try {
    return "share" in navigator && "canShare" in navigator;
  } catch (error) {
    return false;
  }
};

export const clipboardSupported = () => {
  try {
    return "clipboard" in navigator;
  } catch (error) {
    return false;
  }
};