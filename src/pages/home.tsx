import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
	faArrowRight,
	faChartLine,
	faCircleCheck,
	faClockRotateLeft,
	faCode,
	faFileLines,
	faLock,
	faRobot,
	faSearch,
	faShieldHalved,
	faTriangleExclamation,
	faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const GuideSection: React.FC<{
	title: string;
	children: React.ReactNode;
	id: string;
}> = ({ title, children, id }) => (
	<section
		id={id}
		className='space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg'
	>
		<h2 className='text-2xl font-bold text-gray-900'>{title}</h2>
		{children}
	</section>
);

type Section = {
	title: string;
	icon: IconDefinition;
	id: string;
};

const Home: React.FC = () => {
	const sections = useMemo<Section[]>(
		() => [
			{ title: 'Tải File Lên', icon: faUpload, id: 'tải-file-lên' },
			{ title: 'Quét Lỗ Hổng', icon: faShieldHalved, id: 'quét-lỗ-hổng' },
			{ title: 'Phân Tích AI', icon: faRobot, id: 'phân-tích-ai' },
			{ title: 'Xem Kết Quả', icon: faChartLine, id: 'xem-kết-quả' },
		],
		[],
	);

	const [activeSection, setActiveSection] = useState<string>(sections[0].id);

	useEffect(() => {
		const handleScroll = () => {
			const windowHeight = window.innerHeight;
			const screenCenter = windowHeight / 2;

			const sectionElements = sections.map((section) => ({
				id: section.id,
				element: document.getElementById(section.id),
			}));

			const currentSection = sectionElements.find(({ element }) => {
				if (!element) return false;
				const rect = element.getBoundingClientRect();
				return rect.top <= screenCenter && rect.bottom >= screenCenter;
			});

			if (currentSection) {
				setActiveSection(currentSection.id);
			} else {
				const isAtBottom =
					window.innerHeight + window.scrollY >=
					document.documentElement.scrollHeight;
				if (isAtBottom) {
					setActiveSection(sections[sections.length - 1].id);
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, [sections]);

	return (
		<>
			<Helmet>
				<title>FPT UniSAST</title>
			</Helmet>
			<div className='min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12'>
				<div className='mx-auto max-w-7xl'>
					<h1 className='mb-12 text-center text-4xl font-bold text-gray-900'>
						FPT UniSAST{' '}
						<span className='mt-2 block text-2xl font-semibold text-gray-700'>
							Nền Tảng Phân Tích Bảo Mật Thông Minh
						</span>
						<span className='mt-3 block text-lg font-normal text-gray-600'>
							Tự động hóa việc phát hiện và phân tích lỗ hổng bảo
							mật với công nghệ tiên tiến
						</span>
					</h1>

					<div className='mb-12 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm'>
						<p className='max-w-3xl text-center text-lg text-gray-700'>
							<span className='font-semibold'>FPT UniSAST</span>{' '}
							là giải pháp phân tích bảo mật tích hợp, kết hợp sức
							mạnh của{' '}
							<a
								target='_blank'
								href='https://github.com/semgrep/semgrep'
								title='Semgrep'
								className='font-medium'
							>
								Semgrep
							</a>{' '}
							và{' '}
							<a
								target='_blank'
								href='https://github.com/Bearer/bearer'
								title='Bearer'
								className='font-medium'
							>
								Bearer
							</a>{' '}
							với khả năng phân tích thông minh của{' '}
							<span title='AI' className='font-medium'>
								AI
							</span>{' '}
							để bảo vệ mã nguồn của bạn
						</p>

						<div className='mt-8 flex justify-center gap-4'>
							<Link
								to='/scan'
								className='group relative rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
							>
								<span className='relative z-10 inline-flex items-center gap-2'>
									Bắt Đầu Quét
									<FontAwesomeIcon
										icon={faArrowRight}
										className='transition-transform duration-200 group-hover:translate-x-0.5'
									/>
								</span>
							</Link>
							<Link
								to='/history'
								className='group rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
							>
								<span className='relative z-10'>
									Xem Lịch Sử
								</span>
							</Link>
						</div>
					</div>

					<div className='grid grid-cols-[300px_1fr] gap-8'>
						<div className='sticky top-20 h-fit select-none space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
							<h3 className='font-semibold text-gray-900'>
								Nội Dung Chính
							</h3>
							<nav className='space-y-2'>
								{sections.map(({ title, icon, id }) => (
									<a
										key={id}
										href={`#${id}`}
										className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 ${
											activeSection === id
												? 'bg-gray-100 text-gray-900 shadow-sm'
												: 'text-gray-600'
										}`}
									>
										<FontAwesomeIcon
											icon={icon}
											className={`h-4 w-4 ${
												activeSection === id
													? 'text-gray-900'
													: 'text-gray-400'
											}`}
										/>
										{title}
									</a>
								))}
							</nav>
						</div>

						<div className='space-y-8'>
							<GuideSection
								title='Bước 1: Tải File Lên'
								id='tải-file-lên'
							>
								<div className='space-y-4'>
									<p className='text-lg text-gray-800'>
										<span className='font-semibold'>
											Quy trình tải file:
										</span>
									</p>
									<div className='grid grid-cols-2 gap-6'>
										<ul className='space-y-3 text-gray-700'>
											<li className='flex items-start gap-2'>
												<FontAwesomeIcon
													icon={faCircleCheck}
													className='mt-1 h-4 w-4 text-gray-400'
												/>
												<span>
													<span className='font-medium'>
														Chọn file ZIP
													</span>{' '}
													bằng cách nhấp vào{' '}
													<Link
														to='/scan'
														className='inline-block rounded-md bg-gray-100 px-2 py-1 font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1'
													>
														Chọn File
													</Link>{' '}
													hoặc kéo thả
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<FontAwesomeIcon
													icon={faShieldHalved}
													className='mt-1 h-4 w-4 text-gray-400'
												/>
												<span>
													Hỗ trợ tối đa{' '}
													<span className='font-medium'>
														50MB
													</span>{' '}
													cho mỗi file ZIP
												</span>
											</li>
										</ul>
										<div className='rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md'>
											<p className='font-medium text-gray-800'>
												Định dạng hỗ trợ:
											</p>
											<ul className='mt-2 space-y-1 text-gray-600'>
												<li>• File nén ZIP</li>
												<li>
													• Chứa các file .java, .cpp,
													.py
												</li>
											</ul>
										</div>
									</div>
								</div>
							</GuideSection>

							<GuideSection
								title='Bước 2: Quét Lỗ Hổng'
								id='quét-lỗ-hổng'
							>
								<div className='space-y-6'>
									<div className='grid grid-cols-2 gap-6'>
										<div className='space-y-3'>
											<p className='text-lg font-medium text-gray-800'>
												Quy trình quét tự động:
											</p>
											<ul className='space-y-3 text-gray-700'>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faShieldHalved}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														<span className='font-medium'>
															Semgrep
														</span>{' '}
														quét mã nguồn để phát
														hiện các lỗ hổng bảo mật
													</span>
												</li>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faLock}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														<span className='font-medium'>
															Bearer
														</span>{' '}
														phân tích các vấn đề về
														bảo mật dữ liệu
													</span>
												</li>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faRobot}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														<span className='font-medium'>
															AI (tùy chọn)
														</span>{' '}
														phân tích sâu và đề xuất
														cách khắc phục
													</span>
												</li>
											</ul>
										</div>
										<div className='rounded-lg bg-amber-50 p-4 transition-all duration-200 hover:bg-amber-100 hover:shadow-md'>
											<p className='font-medium text-amber-800'>
												Thời gian quét:
											</p>
											<ul className='mt-2 space-y-1 text-amber-700'>
												<li>
													• File nhỏ: 30 giây - 1 phút
												</li>
												<li>
													• File trung bình: 1-3 phút
												</li>
												<li>• File lớn: 3-5 phút</li>
											</ul>
										</div>
									</div>
								</div>
							</GuideSection>

							<GuideSection
								title='Bước 3: Phân Tích AI'
								id='phân-tích-ai'
							>
								<div className='space-y-4'>
									<p className='text-lg text-gray-800'>
										<span className='font-semibold'>
											Phân tích bảo mật:
										</span>
									</p>
									<div className='grid grid-cols-2 gap-6'>
										<ul className='space-y-3 text-gray-700'>
											<li className='flex items-start gap-2'>
												<FontAwesomeIcon
													icon={faSearch}
													className='mt-1 h-4 w-4 text-gray-400'
												/>
												<span>
													Phát hiện các lỗ hổng bảo
													mật nghiêm trọng
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<FontAwesomeIcon
													icon={faTriangleExclamation}
													className='mt-1 h-4 w-4 text-gray-400'
												/>
												<span>
													Cảnh báo về các rủi ro bảo
													mật tiềm ẩn
												</span>
											</li>
											<li className='flex items-start gap-2'>
												<FontAwesomeIcon
													icon={faCode}
													className='mt-1 h-4 w-4 text-gray-400'
												/>
												<span>
													Đề xuất biện pháp khắc phục
													cụ thể
												</span>
											</li>
										</ul>
										<div className='rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md'>
											<p className='font-medium text-gray-800'>
												So sánh mã nguồn:
											</p>
											<ul className='mt-2 space-y-1 text-gray-600'>
												<li>
													• Hiển thị vị trí lỗ hổng
												</li>
												<li>
													• So sánh code trước và sau
													khi sửa
												</li>
												<li>
													• Giải thích chi tiết cách
													khắc phục
												</li>
											</ul>
										</div>
									</div>
								</div>
							</GuideSection>

							<GuideSection
								title='Bước 4: Xem Kết Quả'
								id='xem-kết-quả'
							>
								<div className='space-y-6'>
									<div className='grid grid-cols-2 gap-6'>
										<div>
											<p className='text-lg font-medium text-gray-800'>
												Kết quả bao gồm:
											</p>
											<ul className='mt-3 space-y-3 text-gray-700'>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faFileLines}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														Báo cáo chi tiết về chất
														lượng mã nguồn
													</span>
												</li>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faRobot}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														Đề xuất cải thiện từ AI
													</span>
												</li>
												<li className='flex items-start gap-2'>
													<FontAwesomeIcon
														icon={faCircleCheck}
														className='mt-1 h-4 w-4 text-gray-400'
													/>
													<span>
														Mã nguồn đã được tối ưu
													</span>
												</li>
											</ul>

											<Link
												to='/history'
												className='group mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
											>
												<FontAwesomeIcon
													icon={faClockRotateLeft}
													className='h-4 w-4'
												/>
												Xem Lịch Sử Quét
												<FontAwesomeIcon
													icon={faArrowRight}
													className='transition-transform duration-200 group-hover:translate-x-0.5'
												/>
											</Link>
										</div>
										<div className='rounded-lg bg-green-50 p-4 transition-all duration-200 hover:bg-green-100 hover:shadow-md'>
											<p className='font-medium text-green-800'>
												Xuất báo cáo:
											</p>
											<ul className='mt-2 space-y-1 text-green-700'>
												<li>
													• JSON - cho phân tích kỹ
													thuật
												</li>
											</ul>
										</div>
									</div>

									<div className='mt-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 transition-all duration-200 hover:bg-yellow-100 hover:shadow-md'>
										<p className='flex items-center gap-2 font-bold text-yellow-800'>
											<FontAwesomeIcon
												icon={faTriangleExclamation}
												className='h-5 w-5'
											/>
											Lưu ý về độ chính xác:
										</p>
										<p className='mt-2 text-yellow-700'>
											Mặc dù sử dụng mô hình AI tiên tiến,
											các đề xuất có thể cần được xem xét
											trong ngữ cảnh cụ thể của dự án. Hãy
											kiểm tra kỹ các đề xuất trước khi áp
											dụng để đảm bảo tính phù hợp với yêu
											cầu của bạn.
										</p>
									</div>
								</div>
							</GuideSection>
						</div>
					</div>

					<footer className='mt-12 text-center text-sm text-gray-600'>
						<p>© {new Date().getFullYear()} FPT UniSAST.</p>
					</footer>
				</div>
			</div>
		</>
	);
};

export default Home;
