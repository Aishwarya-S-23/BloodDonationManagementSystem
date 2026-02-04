import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';
import Layout from './components/layout/Layout';
import ConfirmationModal from './components/common/ConfirmationModal';


function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Layout>
            <AppRoutes />
          </Layout>
          <ConfirmationModal />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

