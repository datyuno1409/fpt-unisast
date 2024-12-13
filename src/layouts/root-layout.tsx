import FPTLogo from '@/assets/images/logo.png';
import Header from '@/components/header';
import { faLaptop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';

const MINIMUM_SCREEN_WIDTH = 1024;

const RootLayout: React.FC = () => {
	const [isScreenTooSmall, setIsScreenTooSmall] = useState(
		window.innerWidth < MINIMUM_SCREEN_WIDTH,
	);

	useEffect(() => {
		const handleResize = () => {
			setIsScreenTooSmall(window.innerWidth < MINIMUM_SCREEN_WIDTH);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<div className='min-h-screen'>
			<Helmet>
				<link rel='shortcut icon' href={FPTLogo} type='image/png' />
			</Helmet>
			<Toaster
				position='top-center'
				toastOptions={{
					duration: 4000,
					success: {
						iconTheme: {
							primary: '#10B981',
							secondary: '#ffffff',
						},
					},
					error: {
						iconTheme: {
							primary: '#EF4444',
							secondary: '#ffffff',
						},
					},
					style: {
						background: '#ffffff',
						color: '#1F2937',
						padding: '16px',
						borderRadius: '8px',
						boxShadow:
							'0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
					},
				}}
			/>
			{isScreenTooSmall ? (
				<div className='fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-white p-4 text-center'>
					<div className='mb-6'>
						<div className='mx-auto h-24 w-24 animate-bounce text-[5rem] text-pink-500'>
							<FontAwesomeIcon icon={faLaptop} />
						</div>
					</div>
					<h2 className='mb-2 text-2xl font-bold text-gray-800'>
						(｡•́︿•̀｡)
					</h2>
					<p className='mb-4 text-gray-600'>
						Vui lòng sử dụng thiết bị có độ phân giải lớn hơn để có
						trải nghiệm tốt nhất.
					</p>
					<p className='text-sm text-gray-500'>⊂(◉‿◉)つ</p>
				</div>
			) : (
				<>
					<Header />
					<main className='container mx-auto px-4 py-8'>
						<Outlet />
					</main>
				</>
			)}
		</div>
	);
};

export default RootLayout;
