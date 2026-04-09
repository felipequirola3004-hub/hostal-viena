import { forwardRef } from "react";
import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

const SectionTitle = forwardRef<HTMLDivElement, SectionTitleProps>(({ title, subtitle }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">{title}</h2>
      <div className="divider-gold" />
      {subtitle && <p className="text-muted-foreground text-sm mt-4 max-w-lg mx-auto">{subtitle}</p>}
    </motion.div>
  );
});

SectionTitle.displayName = "SectionTitle";

export default SectionTitle;
