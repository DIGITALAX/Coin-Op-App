import { Link } from "react-router-dom";
import { INFURA_GATEWAY } from "../../../lib/constants";
import usePageNavigation from "../hooks/usePageNavigation";
import { SetStateAction } from "react";

export default function PageNavigation({
  setHideHeader,
}: {
  setHideHeader: (e: SetStateAction<boolean>) => void;
}) {
  const { prevPage, nextPage } = usePageNavigation();
  return (
    <div className="flex w-fit h-fit gap-3 items-center">
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
      <div
        onClick={() => setHideHeader((prev) => !prev)}
        className="relative cursor-pointer w-fit h-fit flex justify-end"
      >
        <img
          draggable={false}
          src="/images/settings.png"
          className="relative flex w-4 h-4"
        />
      </div>
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
