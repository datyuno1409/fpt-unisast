import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
const Home = lazy(() => import('@/pages/home'));
const Scan = lazy(() => import('@/pages/scan'));
const History = lazy(() => import('@/pages/history'));
const NotFound = lazy(() => import('@/pages/not-found'));
const RootLayout = lazy(() => import('../layouts/root-layout'));
const Details = lazy(() => import('@/components/details'));
const FPTEditor = lazy(() => import('@/pages/fpt-editor'));
const StreamEditor = lazy(() => import('@/pages/stream-editor'));
const LoadingSpinner = () => (
	<div className='flex min-h-screen items-center justify-center'>
		<div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-l-transparent border-r-transparent' />
	</div>
);

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: (
				<Suspense fallback={<LoadingSpinner />}>
					<RootLayout />
				</Suspense>
			),
			errorElement: (
				<Suspense fallback={<LoadingSpinner />}>
					<NotFound />
				</Suspense>
			),
			children: [
				{
					index: true,
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<Home />
						</Suspense>
					),
				},
				{
					path: 'scan',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<Scan />
						</Suspense>
					),
				},
				{
					path: 'history',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<History />
						</Suspense>
					),
					children: [
						{
							path: ':id',
							element: (
								<Suspense fallback={<LoadingSpinner />}>
									<Details />
								</Suspense>
							),
						},
					],
				},
				{
					path: 'fpt-editor',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<FPTEditor />
						</Suspense>
					),
				},
				{
					path: 'stream-editor',
					element: (
						<Suspense fallback={<LoadingSpinner />}>
							<StreamEditor />
						</Suspense>
					),
				},
			],
		},
	],
	{
		future: {
			v7_skipActionErrorRevalidation: true,
			v7_relativeSplatPath: true,
			v7_fetcherPersist: true,
			v7_normalizeFormMethod: true,
			v7_partialHydration: true,
		},
	},
);

const AppRouter: React.FC = () => {
	return <RouterProvider router={router} />;
};

export default AppRouter;
