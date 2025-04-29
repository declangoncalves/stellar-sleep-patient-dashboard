import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdditionalPatientInfo } from '../AdditionalPatientInfo';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock fetch
global.fetch = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('AdditionalPatientInfo', () => {
  const mockCustomFields = [
    { id: 1, name: 'Allergies', required: false },
    { id: 2, name: 'Medications', required: false },
  ];

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    // Mock fetch for custom fields
    (global.fetch as jest.Mock).mockImplementation(url => {
      if (url.includes('/api/custom-fields/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCustomFields),
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    renderWithQueryClient(
      <AdditionalPatientInfo
        patientId={1}
        customFieldValues={[]}
        onUpdate={() => {}}
      />,
    );

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('renders custom fields after loading', async () => {
    renderWithQueryClient(
      <AdditionalPatientInfo
        patientId={1}
        customFieldValues={[]}
        onUpdate={() => {}}
      />,
    );

    // Wait for loading to complete and fields to be rendered
    await waitFor(
      () => {
        expect(screen.getByText('Allergies')).toBeInTheDocument();
        expect(screen.getByText('Medications')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles adding a new custom field', async () => {
    const onUpdate = jest.fn();
    renderWithQueryClient(
      <AdditionalPatientInfo
        patientId={1}
        customFieldValues={[]}
        onUpdate={onUpdate}
      />,
    );

    // Wait for initial fields to load
    await waitFor(() => {
      expect(screen.getByText('Allergies')).toBeInTheDocument();
    });

    // Type in the new field name
    const input = screen.getByPlaceholderText('Enter field name');
    await userEvent.type(input, 'New Field');

    // Mock the create field API call
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ id: 3, name: 'New Field', required: false }),
      }),
    );

    // Click the add button using getByRole
    const addButton = screen.getByRole('button', { name: 'Add New Field' });
    await userEvent.click(addButton);

    // Wait for the field to be added and loading to complete
    await waitFor(
      () => {
        expect(screen.getByText('New Field')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
