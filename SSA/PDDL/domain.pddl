;; domain.pddl
(define (domain parcel-delivery)
  (:requirements 
    :typing 
    :negative-preconditions 
    :fluents        ;; for numeric functions
    :equality       ;; for “=” in init
  )
  (:types 
    agent parcel delivery_tile location
  )

  ;; Predicates
  (:predicates
    (at       ?a - agent    ?l - location)    ; agent at a location
    (at-parcel ?p - parcel  ?l - location)    ; parcel waiting at a location
    (adjacent ?l1 - location ?l2 - location)   ; grid adjacency
    (at-tile  ?t - delivery_tile     ?l - location)    ; delivery tile at a location
    (carrying ?a - agent    ?p - parcel)      ; agent holds parcel
    (delivered ?p - parcel)                   ; parcel has been delivered
  )

  ;; Numeric functions
  (:functions
    (total-cost)        ; accumulated penalty
    (num-undelivered)   ; parcels not yet delivered
  )

  ;; MOVE: penalty = 1 + #undelivered
  (:action move
    :parameters (?a - agent ?from - location ?to - location)
    :precondition (and (at ?a ?from) (adjacent ?from ?to))
    :effect (and
      (not (at ?a ?from))
      (at ?a ?to)
      (increase (total-cost) (+ 1 (num-undelivered)))
    )
  )

  ;; PICKUP: pick any parcel at same location
  (:action pickup
    :parameters (?a - agent ?p - parcel ?l - location)
    :precondition (and
      (at	?a ?l)
      (at-parcel	?p ?l)
      (not (delivered ?p))
    )
    :effect (and
      (carrying ?a ?p)
      (not (at-parcel ?p ?l))
    )
  )

  ;; DELIVER: drop any carried parcel at any tile
  (:action deliver
    :parameters (?a - agent ?p - parcel ?t - delivery_tile ?l - location)
    :precondition (and
      (at ?a ?l)
      (at-tile ?t ?l)
      (carrying ?a ?p)
    )
    :effect (and
      (not (carrying ?a ?p))
      (delivered ?p)
      ;; one fewer undelivered parcel
      (increase (num-undelivered) -1)
    )
  )
)
