# BONK Mobile Banking App

A modern, secure mobile banking application built with Ionic, React, and Supabase.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Overview of account balances and recent transactions
- **Transactions**: View detailed transaction history
- **Deposit & Withdraw**: Manage your funds with ease
- **Transfer**: Send money to other users
- **Card Management**: View and manage your banking cards
- **Investment**: Access investment opportunities
- **Settings**: Customize your app preferences
- **Session Management**: Automatic timeout for security

## Tech Stack

- **Frontend**: React, Ionic, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Mobile**: Capacitor for native functionality
- **Testing**: Cypress (E2E), Vitest (Unit)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Bonkv2.git
   cd Bonkv2
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   ionic serve
   ```

### Building for Mobile

#### Android

```
ionic serve
ionic cap sync
ionic cap open android
```

#### iOS (macOS only)

```
ionic run build
ionic cap sync
ionic cap open ios
```

## Testing

- Run unit tests:
  ```
  ionic run test.unit
  # or
  ionic test.unit
  ```

- Run E2E tests:
  ```
  ionic run test.e2e
  # or
  ionic test.e2e
  ```

## Project Structure

- `src/` - Source code
  - `pages/` - Application pages
  - `components/` - Reusable UI components
  - `utils/` - Utility functions
  - `theme/` - Styling and theming
  - `supabaseClient.ts` - Supabase client configuration

## License

[Apache-2.0 License]

## Contact

For any questions or support, please contact [g1galba042804@gmail.com](mailto:g1galba042804@gmail.com).
