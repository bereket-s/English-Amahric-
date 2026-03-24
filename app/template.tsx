'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Do not animate the root path heavily, or handle it differently if desired
  const isRoot = pathname === '/'

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: isRoot ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 1 
      }}
      style={{ width: '100%', minHeight: 'calc(100vh - var(--nav-height))', paddingTop: 'var(--nav-height)' }}
    >
      {children}
    </motion.div>
  )
}
