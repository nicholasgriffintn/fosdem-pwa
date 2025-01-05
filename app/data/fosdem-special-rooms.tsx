export const fosdemSpecialRooms = {
  S: {
    type: 'stand',
    title: 'Stand',
    description: (year: number) => (
      <p>
        This is a stand presentation.You can find all FOSDEM stands at{' '}
        <a
          href={`https://fosdem.org/${year}/stands/`}
          target="_blank"
          rel="noreferrer"
        >
          the stands overview page
        </a>
        .
      </p>
    ),
  },
  I: {
    type: 'infodesk',
    title: 'Info Desk',
    description: () => (
      <p>This is an info desk location.Please visit the location in person for assistance, normally it is in the K building.</p>
    ),
  },
  B: {
    type: 'bof',
    title: 'Birds of a Feather',
    description: () => (
      <p>This is a Birds of a Feather(BOF) meeting.These are informal gatherings for face - to - face discussions.</p>
    ),
  },
}