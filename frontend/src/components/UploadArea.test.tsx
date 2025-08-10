import { render, screen } from '@testing-library/react';
import UploadArea from './UploadArea';

describe('UploadArea', () => {
  it('renders drag & drop text', () => {
    render(<UploadArea onPresigned={() => {}} />);
    expect(screen.getByText(/Drag & drop/i)).toBeInTheDocument();
  });
});
