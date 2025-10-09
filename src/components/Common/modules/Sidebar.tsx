import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Walkthrough } from "../types/common.types";
import { pageMap } from "../../../lib/constants";
export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div
      className={`relative bg-black text-white h-full flex justify-between items-center flex-col py-4 w-20 pl-2 pr-3 gap-10`}
    >
      <div className="relative w-fit h-fit flex items-center justify-center">
        <img
          className="relative h-32 flex items-center justify-center"
          src="/images/coinop.png"
          draggable={false}
        />
      </div>
      <div className="relative w-fit h-fit flex border-2 border-[#090C38] rounded-full p-px items-center justify-center">
        <div className="relative w-fit h-fit flex border-2 border-[#383309] rounded-full p-px items-center justify-center">
          <div
            className={`relative w-fit h-fit flex justify-center flex-col gap-6 items-center border-2 border-[#380935] py-6 px-1 text-center rounded-full`}
          >
            {Object.keys(Walkthrough).map((item) => {
              return (
                <Link
                  key={item}
                  title={t(item).toUpperCase()}
                  to={pageMap[item]}
                  className="relative w-fit h-fit flex flex-col gap-px items-center justify-center cursor-pointer hover:opacity-70"
                >
                  <div className="relative w-fit h-fit flex">
                    <img
                      className="w-4 h-4 flex relative"
                      draggable={false}
                      src={`/images/${item.toLowerCase()}.png`}
                    />
                  </div>
                  <div
                    className={`relative uppercase text-xs w-fit h-fit flex items-center font-awk p-2 justify-center text-center hover:text-amarillo ${
                      location.pathname == pageMap[item]
                        ? "text-rosa"
                        : "text-black"
                    }`}
                  >
                    <img
                      className="w-full h-fit z-0 flex absolute"
                      draggable={false}
                      src={`/images/bgama.png`}
                    />
                    <div className="relative w-fit h-fit z-10 flex">
                      {t(item)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative w-full h-fit flex flex-col items-center justify-center gap-6">
        <div className="relative w-full h-fit flex flex-col gap-2 justify-center items-center text-sm text-left font-ark">
          {[
            { name: t("about"), href: "/About" },
            { name: t("activity"), href: "/Activity" },
          ].map((item) => {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative whitespace-nowrap w-fit h-fit flex text-noche hover:text-amarillo cursor-pointer"
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
