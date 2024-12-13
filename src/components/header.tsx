import {
	faBook,
	faHistory,
	faSearch,
	faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from 'react-router-dom';

const navItems = [
	{
		to: '/',
		icon: faShieldHalved,
		label: 'Trang chủ',
	},
	{
		to: '/scan',
		icon: faSearch,
		label: 'Quét files',
	},
	{
		to: '/history',
		icon: faHistory,
		label: 'Xem lịch sử báo cáo',
	},
] as const;

const Header: React.FC = () => {
	return (
		<header className='sticky top-0 z-50 bg-white/90 shadow backdrop-blur-sm'>
			<nav className='container mx-auto px-4 py-4'>
				<ul className='flex gap-4'>
					{navItems.map(({ to, icon, label }) => (
						<li key={to}>
							<NavLink
								to={to}
								className={({ isActive }) =>
									`flex items-center gap-2 ${
										isActive
											? 'font-medium text-gray-900'
											: 'text-gray-600 hover:text-gray-800'
									}`
								}
							>
								<FontAwesomeIcon icon={icon} />
								<span>{label}</span>
							</NavLink>
						</li>
					))}
					<li>
						<a
							href='/docs'
							target='_blank'
							rel='noopener noreferrer'
							className='flex items-center gap-2 text-gray-600 hover:text-gray-800'
						>
							<FontAwesomeIcon icon={faBook} />
							<span>API Docs</span>
						</a>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default Header;
