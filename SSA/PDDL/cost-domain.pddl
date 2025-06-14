(define (domain parcel-delivery)
  (:requirements :strips :typing :fluents)  ; Action costs handled via numeric fluents
  (:types agent location parcel delivery_tile)

  (:predicates
    (at ?a - agent ?l - location)        ; Agent is at a location
    (has ?a - agent ?p - parcel)         ; Agent has a parcel
    (at-parcel ?p - parcel ?l - location) ; A parcel is at a location
    (delivered ?p - parcel)              ; A parcel has been delivered
    (at-tile ?d - delivery_tile ?l - location) ; A delivery tile is at a location
  )

  

(:functions
    (cost ?from - location ?to - location)  ; Define the function for move cost
    (total-cost)
  )
    
  ; Action for moving from one location to another
  (:action move
    :parameters (?a - agent ?from - location ?to - location)
    :precondition (and (at ?a ?from) (not (at ?a ?to)))  ; Can move only between different locations
    :effect (and 
      (not (at ?a ?from)) 
      (at ?a ?to) 
      (increase (total-cost) (cost-of-move ?from ?to))  ; Increase total cost by the cost of moving from 'from' to 'to'
    )
  )

  ; Action for picking up a parcel
  (:action pick_up
    :parameters (?a - agent ?p - parcel ?loc - location)
    :precondition (and (at ?a ?loc) (at-parcel ?p ?loc) (not (has ?a ?p)))  ; Agent must be at parcel location and not already have the parcel
    :effect (and (has ?a ?p) (not (at-parcel ?p ?loc)))  ; Agent picks up the parcel
  )

  ; Action for delivering a parcel
  (:action deliver
    :parameters (?a - agent ?p - parcel ?d - delivery_tile ?l - location)
    :precondition (and (has ?a ?p) (at ?a ?l) (at-tile ?d ?l))  ; Agent must be at a delivery tile
    :effect (
        and (delivered ?p) (not (has ?a ?p)))
    ) ; Parcel is delivered
)
