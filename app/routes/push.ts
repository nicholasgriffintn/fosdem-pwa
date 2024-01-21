export const action = async ({ request }) => {
  try {
    /*
    {
      "subscription": {
        "endpoint": "https://fcm.googleapis.com/fcm/send/ceZfcvS0ir8:APA91bFjWgEW7YmyxRDgLEtRX-woesvTyJsEJh1xFwsAJUILdSuXRrmEy-feMZEo_9HlIDEYjtwzkU-h5_TN1K5c9hueT3xlz-RtaEsORWHTfaF3VGQBgbuHNTsS-0TjBHn57GTpPUlY",
        "expirationTime": null,
        "keys": {
          "p256dh": "BENIR2ZhIl8bNTjOiywBEfNdO8MGwu3t2m5h7dXa4HrU125ls5tw7QRkeJzG7rPkFeR2y09nyKoBH-QiA6EhlLM",
          "auth": "nMvHASbqGbikO66ynutuOg"
        }
      },
      "type": "subscribe",
      "payload": {
        "user": {
          "id": 17381151,
          "name": "remember_wall_experience",
          "type": "guest"
        }
      }
    }
    */
    const data = await request.formData();

    const type = data.get('type');
    const subscription = JSON.parse(data.get('subscription'));
    const { auth, endpoint, p256dh } = subscription;
    const payload = JSON.parse(data.get('payload'));
    const { user } = payload;

    switch (type) {
      case 'send-push':
        await console.log({
          name: 'push.user',
          payload: {
            action: 'send-push',
            userId: data.get('userId'),
            recepientId: data.get('recepientId'),
            pushData: data.get('pushData'),
          },
        });
        break;
      case 'subscribe':
        console.log(user.id, {
          auth,
          endpoint,
          p256dh,
        });
        break;
      default:
        console.error('Unknown action');
        break;
    }

    return null;
  } catch (error) {
    console.error(error);

    return null;
  }
};

export const workerAction = async ({ context }) => {
  const { fetchFromServer } = context;

  try {
    await fetchFromServer();
  } catch (error) {
    console.error('Push Fetch Failed');
  }

  return null;
};
