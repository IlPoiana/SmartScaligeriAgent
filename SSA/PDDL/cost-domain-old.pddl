;; domain.pddl
(define (domain parcel-delivery)
  (:requirements 
    :typing 
    :negative-preconditions 
    :fluents        ;; numeric functions & effects
    :equality       ;; for “=” in init
  )
  (:types 
    agent parcel delivery_tile location
  )

  ;; Predicates
  (:predicates
    (at        ?a - agent     ?l - location)
    (at-parcel ?p - parcel    ?l - location)
    (adjacent  ?l1 - location ?l2 - location)
    (at-tile   ?t - delivery_tile ?l - location)
    (carrying  ?a - agent     ?p - parcel)
    (delivered ?p - parcel)
  )

  ;; Numeric functions
  (:functions
    (total-cost)                 ; accumulated penalty
    (sum-undelivered-cost)       ; sum of (cost ?p) for all ¬delivered ?p
    (cost ?p - parcel)           ; per-parcel cost weight
  )

  ;; MOVE: penalty = 1 + sum of costs of all undelivered parcels
  (:action move
    :parameters (?a - agent ?from - location ?to - location)
    :precondition (and (at ?a ?from)
                       (adjacent ?from ?to))
    :effect (and
      (not (at ?a ?from))
      (at ?a ?to)
      (increase (total-cost) (+ 1 (sum-undelivered-cost)))
      ;(increase (total-cost) (sum-undelivered-cost))
      ;(increase (total-cost) 1)
    
    )
  )

  ;; PICKUP: same as before
  (:action pickup
    :parameters (?a - agent ?p - parcel ?l - location)
    :precondition (and
      (at ?a ?l)
      (at-parcel ?p ?l)
      (not (delivered ?p))
    )
    :effect (and
      (carrying ?a ?p)
      (not (at-parcel ?p ?l))
    )
  )

  ;; DELIVER: drop parcel, mark delivered, adjust counts & sum-cost
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
      (decrease (sum-undelivered-cost) (cost ?p))
    )
  )
)
