import React, { ElementType } from 'react';

interface TranslatableProps {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  [key: string]: any;
}

/**
 * Wrapper component that marks content as translatable
 * This ensures the PageTranslationManager will translate the content
 */
export const Translatable: React.FC<TranslatableProps> = ({ 
  children, 
  className = '', 
  as: Component = 'span',
  ...props 
}) => {
  const ElementComponent = Component as ElementType;
  
  return (
    <ElementComponent
      {...props}
      className={`translatable ${className}`.trim()}
      data-translate="true"
    >
      {children}
    </ElementComponent>
  );
};

export default Translatable;
