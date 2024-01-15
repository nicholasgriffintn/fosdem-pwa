addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest() {
  return new Response('This should not be called directly!');
}

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule(event));
});

async function handleSchedule(event) {
  console.log(event.scheduledTime);

  try {
    const fetch_status = await fetch('https://fosdempwa.com/api/build-data', {
      method: 'GET',
      headers: {
        'X-Fosdem-Secret': 'REPLACE_ME',
      },
    });

    console.log('Fetched:', fetch_status.ok);

    if (fetch_status.ok) {
      return new Response('Done!');
    } else {
      return new Response('Errored!');
    }
  } catch (error) {
    console.error(error);

    return new Response('Errored!');
  }
}
