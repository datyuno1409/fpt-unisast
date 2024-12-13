import { Helmet } from 'react-helmet-async';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

const NotFound: React.FC = () => {
	const error = useRouteError();

	return (
		<>
			<Helmet>
				<title>FPT Unisast</title>
			</Helmet>
			<div className='flex min-h-screen items-center justify-center'>
				<div className='text-center'>
					<h1 className='mb-4 text-4xl font-bold'>
						{isRouteErrorResponse(error)
							? 'Không Tìm Thấy Trang'
							: 'Rất tiếc! Đã xảy ra lỗi'}
					</h1>
					<Link to='/' className='text-gray-600 hover:text-gray-800'>
						Trở về trang chủ
					</Link>
				</div>
			</div>
		</>
	);
};

export default NotFound;
