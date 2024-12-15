import clsx from 'clsx';

export function EventPlayer({ event, isMobile = false }) {
  const videoWrapperClassName = clsx(
    'flex h-full items-center justify-center bg-muted text-muted-foreground relative',
    {
      'min-h-[340px] rounded-md': isMobile,
      'min-h-[640px]': !isMobile,
    }
  );
  return (
    <div className={videoWrapperClassName}>
      {event.isLive && event.streams?.length ? (
        <div>
          {event.streams.map((stream) => {
            return (
              <div key={stream.url} className="w-full aspect-video">
                <video preload="none" controls>
                  <source
                    src={stream.url}
                    type='application/x-mpegURL; codecs="avc1.42E01E, mp4a.40.2"'
                  />
                </video>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div
            className={`bg-${event.type} w-full h-full absolute top-0 left-0 z-0'`}
          />
          <div className="p-6 relative bg-muted p-6 rounded-md">
            <span>Sorry! The stream isn't available yet!</span>
          </div>
        </div>
      )}
    </div>
  );
}