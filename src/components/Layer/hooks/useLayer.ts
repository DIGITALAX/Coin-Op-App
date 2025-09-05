const useLayer = () => {
  const formatPrice = (priceWei: string) => {
    return (Number(priceWei) / 10 ** 18).toFixed(2);
  };
  const getTotalChildrenPrice = (
    childReferences: { price: string; uri: string }[]
  ) => {
    const total = childReferences.reduce((acc, child) => acc + Number(child.price), 0);
    return (total / 10 ** 18).toFixed(2);
  };
  return {
    formatPrice,
    getTotalChildrenPrice,
  };
};
export default useLayer;
