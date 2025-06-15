(define (problem parcel-delivery-problem)
  (:domain parcel-delivery)
  (:objects 
    agent1 - agent
    loc1 loc2 loc3 - location
    parcel1 - parcel
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
    (at-tile tile1 loc3)
    (= (cost loc1 loc2) 5)  ; Example cost
    (= (cost-of-move loc2 loc1) 5)  ; Example cost
    (= (cost-of-move loc2 loc3) 3)  ; Example cost
    (= (cost-of-move loc3 loc2) 3)  ; Example cost
    (= (cost-of-move loc1 loc3) 7)
    (= (cost-of-move loc3 loc1) 7)
    (= (total-cost) 0)
  )

  (:goal
    (and (delivered parcel1))
  )

  

)
