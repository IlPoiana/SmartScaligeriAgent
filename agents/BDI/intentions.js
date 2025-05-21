function rewardFun(intention, {x: x1, y:y1}) {
    const id_p = intention.predicate[3]
    const reward = parcels.get(id_p).reward
    console.log("CHECK 3 reward: ", reward, " distance: ", distance({x:x1,y:y1}, me));
    return reward - distance({x:x1,y:y1},{ x:parcels.get(id_p).x, y:parcels.get(id_p).y});
  }