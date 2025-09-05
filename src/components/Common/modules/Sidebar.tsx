import { Link, useLocation } from "react-router-dom";
import { Walkthrough } from "../types/common.types";
import { pageMap } from "../../../lib/constants";
export default function Sidebar() {
  const location = useLocation();
  return (
    <div
      className={`relative bg-oscurazul text-white h-full flex justify-between items-center flex-col py-4 w-[calc(100vw-2.5rem)] sm:w-fit pl-2 pr-3`}
    >
      <div className="relative w-fit h-fit flex items-center justify-center flex-col gap-2">
        <Link
          className="relative w-fit h-fit flex items-center justify-center cursor-pointer font-mega text-sm uppercase text-center text-white"
          to={"/"}
        >
          COIN OP
        </Link>
      </div>
      <div
        className={`relative w-fit h-fit flex justify-center flex-col gap-4 items-start`}
      >
        {Object.keys(Walkthrough).map((item) => {
          return (
            <Link
              key={item}
              to={pageMap[item]}
              className="relative w-fit h-fit flex flex-row gap-3 items-center justify-center cursor-pointer hover:opacity-70"
            >
              <div
                className={`relative uppercase text-xxs w-fit h-fit flex items-center font-sat justify-center text-center hover:text-amarillo ${
                  location.pathname == pageMap[item]
                    ? "text-amarillo"
                    : "text-white"
                }`}
              >
                {item}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="relative w-full h-fit flex flex-col items-center justify-start gap-6">
        <div className="relative w-full h-fit flex flex-col gap-2 justify-start items-start text-sm text-left">
          {[
            { name: "About", href: "/About" },
            { name: "Activity", href: "/Activity" },
          ].map((item) => {
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative whitespace-nowrap w-fit h-fit flex text-noche hover:text-amarillo font-satB cursor-pointer"
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
