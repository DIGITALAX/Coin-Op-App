import { INFURA_GATEWAY } from "../../../lib/constants";
export default function About() {
  return (
    <div className="relative w-full h-full flex py-5 justify-center">
      <div className="relative max-w-3/4 items-center flex justify-between flex-col gap-5">
        <div
          className="font-monu text-white text-5xl flex flex-col items-center justify-center w-3/4 h-fit break-words text-center pt-0"
          draggable={false}
        >
          Made for a world that doesn't wait for attention.
        </div>
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-monu text-2xl text-left w-fit h-fit flex justify-start items-center">
            Tutorial.
          </div>
          <div
            className={`relative w-fit h-fit text-left justify-center break-all items-center text-sm whitespace-pre-line font-mana`}
          >
            View the Coin Op tutorial.
          </div>
        </div>
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-monu text-2xl text-left w-fit h-fit flex justify-start items-center">
            Shipping & Returns.
          </div>
          <div
            className={`relative w-fit h-fit text-left justify-center break-all items-center text-sm whitespace-pre-line font-mana`}
          >
            All orders are shipped expressed, domestic and international.
            Shipping can take up to 7-14 business days for US domestic delivery
            and more than 14-21 business days for international delivery. If
            there are any issues with your shipment, including export
            restrictions, you will be notified via your account page under order
            status.\n\nIf you are unsatisfied with your purchase for any reason,
            you can return eligible items within 30 days of confirmed delivery
            for a full refund. Please reach out through Lens XMTP secure
            on-chain messaging to initiate the process. Once received, we will
            inspect the items and process your refund within 4-5 business days.
            Refunds are issued to your wallet. If you experience any problems
            with your order, feel free to reach out via our social media
            channels for assistance.
          </div>
        </div>
        <div className="relative w-3/4 h-fit items-center justify-center flex">
          <div className="relative w-fit px-4 py-2 h-full rounded-sm bg-oscurazul font-sat text-white flex flex-row items-center justify-center gap-5">
            <div className="relative w-14 h-11 items-center justify-center flex">
              <img
                src={`${INFURA_GATEWAY}/ipfs/QmfVta8TP8BmZqo6Pvh6PgosRBM9mm71txukUxQp9fri17`}
                className="object-cover h-full w-full"
                draggable={false}
              />
            </div>
            <div
              className="relative w-full h-full overflow-y-scroll flex"
              id="xScroll"
            >
              <div className="relative w-fit h-fit break-words items-center justify-center">
                We know it's a lot to keep up with. How can you know if this is
                the blend of instant convenience and purchasing power you've
                been waiting for?
              </div>
            </div>
            <div className="relative w-1.5 h-full bg-black"></div>
            <div className="relative w-fit h-fit items-center justify-center flex flex-col text-center">
              <div className="relative w-fit h-fit items-center justify-center flex font-satB whitespace-nowrap">
                Ask a machine
              </div>
              <div className="relative w-fit h-fit items-center justify-center flex text-sm">
                or, just start here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
