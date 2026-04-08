// TODO: Integrate a real ad network SDK (e.g., Google AdSense, AdMob for Web, or a Web3 provider).
// Currently, this is a simulated 2-second delay acting as a "free daily reward" placeholder.
export const adService = {
  showRewardedAd: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }
};
