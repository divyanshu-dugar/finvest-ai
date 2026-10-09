import Reveal from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

export default function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className="text-[13px] font-medium text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-display text-3xl font-normal leading-[1.12] tracking-[-0.025em] text-ink sm:text-[2.6rem]">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">{description}</p>}
    </Reveal>
  );
}
