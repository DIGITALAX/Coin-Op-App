import { Link } from "react-router-dom";
import { INFURA_GATEWAY } from "../../../lib/constants";
import usePageNavigation from "../hooks/usePageNavigation";
import { PageNavigationProps } from "../types/common.types";

export default function PageNavigation({ currentPage }: PageNavigationProps) {
  const { prevPage, nextPage } = usePageNavigation(currentPage);
  return (
    <div className="absolute bottom-2 right-4 flex gap-3 items-center">
      {prevPage && (
        <Link
          to={prevPage}
          className="relative w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transform rotate-180"
        >
          <img
            src={`${INFURA_GATEWAY}/ipfs/QmXvzWPiUqMw6umcS3Qp6yXCTwLzZtbXcWH8fKE6i3ZFpY`}
            alt="Previous"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Link>
      )}
      {nextPage && (
        <Link
          to={nextPage}
          className="relative w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70"
        >
          <img
            src={`${INFURA_GATEWAY}/ipfs/QmXvzWPiUqMw6umcS3Qp6yXCTwLzZtbXcWH8fKE6i3ZFpY`}
            alt="Next"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </Link>
      )}
    </div>
  );
}