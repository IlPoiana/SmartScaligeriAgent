(define (problem parcel-delivery-problem)
  (:domain parcel-delivery)
  (:objects 
    agent1 - agent
    loc1 loc2 loc3 loc4 - location
    parcel1 parcel2 - parcel
    tile1 - delivery_tile
  )

;(:predicates
;    (at ?a - agent ?l - location)        ; Agent is at a location
;    (has ?a - agent ?p - parcel)         ; Agent has a parcel
;    (at-parcel ?p - parcel ?l - location) ; A parcel is at a location
;    (delivered ?p - parcel)              ; A parcel has been delivered
;    (at-tile ?d - delivery_tile ?l - location) ; A delivery tile is at a location
;  )  

  
  (:init
    (at agent1 loc1)
    (at-parcel parcel1 loc2)
    (at-parcel parcel2 loc2)
    (at-tile tile1 loc3)
    (= (cost-of-move loc1 loc2) 1)  ; Example cost
    (= (cost-of-move loc2 loc1) 1)  ; Example cost
    (= (cost-of-move loc2 loc3) 8)  ; Example cost
    (= (cost-of-move loc3 loc2) 1)  ; Example cost
    (= (cost-of-move loc1 loc3) 100)
    (= (cost-of-move loc3 loc1) 1)
    (= (cost-of-move loc1 loc4) 1)
    (= (cost-of-move loc4 loc1) 15)
    (= (cost-of-move loc4 loc2) 1)
    (= (cost-of-move loc4 loc3) 1)
    (= (total-cost) 0)
    (= (threshold) 10)
  )

  (:goal
    (and (delivered parcel1)
        (delivered parcel2)
    )
  )

)
