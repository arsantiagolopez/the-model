import type { FC, ReactNode } from "react";

interface Props {
  title: string;
  helper?: string;
  RightItem?: ReactNode;
  withMobileNavigation?: boolean;
}

const PageHeader: FC<Props> = ({ title, helper, RightItem, withMobileNavigation }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {helper && <p className="text-sm text-gray-400">{helper}</p>}
      </div>
      {RightItem && <div>{RightItem}</div>}
    </div>
  );
};

export { PageHeader };