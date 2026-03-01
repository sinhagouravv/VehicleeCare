import * as React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from './button';

const Icon = ({ mouseX, mouseY, iconData, index }) => {
    const ref = React.useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 20 });
    const springY = useSpring(y, { stiffness: 300, damping: 20 });

    React.useEffect(() => {
        const handleMouseMove = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const distance = Math.sqrt(
                    Math.pow(mouseX.current - (rect.left + rect.width / 2), 2) +
                    Math.pow(mouseY.current - (rect.top + rect.height / 2), 2)
                );

                if (distance < 150) {
                    const angle = Math.atan2(
                        mouseY.current - (rect.top + rect.height / 2),
                        mouseX.current - (rect.left + rect.width / 2)
                    );
                    const force = (1 - distance / 150) * 50;
                    x.set(-Math.cos(angle) * force);
                    y.set(-Math.sin(angle) * force);
                } else {
                    x.set(0);
                    y.set(0);
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [x, y, mouseX, mouseY]);

    return (
        <motion.div
            ref={ref}
            key={iconData.id}
            style={{
                x: springX,
                y: springY,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: index * 0.08,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={cn('absolute', iconData.className)}
        >
            <motion.div
                className={`flex items-center justify-center w-16 h-16 md:w-20 md:h-20 p-3 rounded-3xl shadow-xl bg-white/80 backdrop-blur-md border border-slate-200/50 ${iconData.color || 'text-slate-800'}`}
                animate={{
                    y: [0, -8, 0, 8, 0],
                    x: [0, 6, 0, -6, 0],
                    rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                }}
            >
                <iconData.icon className="w-8 h-8 md:w-10 md:h-10" />
            </motion.div>
        </motion.div>
    );
};

const FloatingIconsHero = React.forwardRef(({ className, title, subtitle, ctaText, ctaHref, icons, ...props }, ref) => {
    const mouseX = React.useRef(0);
    const mouseY = React.useRef(0);

    const handleMouseMove = (event) => {
        mouseX.current = event.clientX;
        mouseY.current = event.clientY;
    };

    return (
        <section
            ref={ref}
            onMouseMove={handleMouseMove}
            className={cn(
                'relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden',
                className
            )}
            {...props}
        >
            {/* Background with abstract details */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl opacity-70 animate-pulse-slow mix-blend-multiply" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/40 to-blue-50/40 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.8)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20 pointer-events-none" />
            </div>

            <div className="absolute inset-0 w-full h-full z-0">
                {icons.map((iconData, index) => (
                    <Icon
                        key={iconData.id}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        iconData={iconData}
                        index={index}
                    />
                ))}
            </div>

            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pb-20">
                {title}

                <p className="mt-8 max-w-3xl mx-auto text-xl md:text-2xl text-slate-600 font-medium leading-relaxed bg-white/40 p-2 rounded-xl backdrop-blur-sm">
                    {subtitle}
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-5">
                    <Button asChild size="lg" className="px-8 py-7 md:px-10 text-xl font-black bg-gradient-to-r from-[#011023] to-[#0a2540] hover:shadow-[0_20px_40px_-15px_rgba(5,37,88,0.5)] text-white rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <a href={ctaHref}>{ctaText}</a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="px-8 py-7 md:px-10 text-xl font-black rounded-2xl border-2 border-slate-200/60 bg-white/60 backdrop-blur-xl hover:bg-white text-[#011023] hover:border-blue-200 transition-all shadow-sm">
                        <a href="#categories">Explore Categories</a>
                    </Button>
                </div>

                {/* Stats */}
                <div className="mt-5 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl bg-white/30 backdrop-blur-sm p-4 rounded-3xl">
                    {[
                        { label: 'Active Partners', value: '10,000+' },
                        { label: 'Monthly Users', value: '2.5M+' },
                        { label: 'States Covered', value: '15+' },
                        { label: 'Revenue Generated', value: '₹500Cr+' }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <h4 className="text-3xl font-black text-[#011023] mb-1">{stat.value}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

FloatingIconsHero.displayName = 'FloatingIconsHero';

export { FloatingIconsHero };
