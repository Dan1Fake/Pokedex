import { useState, useEffect } from "react"
import { getFullPokedexNumber, getPokedexNumber } from "../utils"
import TypeCard from "./TypeCard"
import Modal from "./Modal"


export default function PokeCard(props) {
    const { selectedPokemon } = props
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [skill, setSkill] = useState(null)
    const [loadingSkill, setLoadingSkill] = useState(false)
    const [notFound, setNotFound] = useState(false)

    const { name, stats, types, moves, sprites, id } = data || {}


    const imgList = Object.keys(sprites || {}).filter(val => {
        if (!sprites[val]) { return false }
        else if (["versions", "other"].includes(val)) { return false }
        else { return true }
    })

    async function fetchMoveData(move, moveUrl) {
        if (loadingSkill || !localStorage || !moveUrl) { return }

        // check cache for move
        let c = {}
        if (localStorage.getItem("pokemon-moves")) {
            c = JSON.parse(localStorage.getItem("pokemon-moves"))
        }

        if (move in c) {
            setSkill(c[move])
            console.log("Found move is cache")
            return
        }

        try {
            setLoadingSkill(true)
            const response = await fetch(moveUrl)
            const moveData = await response.json()
            console.log("Fetched move from API", moveData)
            const description = moveData?.flavor_text_entries.filter(
                val => {
                    return val.version_group?.name === "firered-leafgreen"
                })[0].flavor_text

            const skillData = {
                name: move,
                description: description,
            }
            setSkill(skillData)
            c[move] = skillData
            localStorage.setItem("pokemon-moves", JSON.stringify(c))

        } catch (error) {
            console.error(error)
            setSkill({ name: move, description: "Not Found!" })
        } finally {
            setLoadingSkill(false)
        }
    }
    useEffect(() => {
        // if loading, exit logic
        if (loading || !localStorage) { return }
        // check if the selected pokemon information is available in the cache

        // 1. define the cache
        let cache = {}
        if (localStorage.getItem("pokedex")) {
            cache = JSON.parse(localStorage.getItem("pokedex"))
        }
        // 2. check if the selected pokemon is in the cache, otherwise fetch from the API

        if (selectedPokemon in cache) {
            // read from cache
            setData(cache[selectedPokemon])
            console.log("Found pokemon is cache")
            setNotFound(false)
            return

        }

        // we passed all the cache stuff to no avail and now need to fetch the data from the API

        async function fetchPokemonData() {
            setLoading(true)
            try {
                const baseUrl = "https://pokeapi.co/api/v2/"
                const suffix = "pokemon/" + getPokedexNumber(selectedPokemon)
                const finalUrl = baseUrl + suffix
                const response = await fetch(finalUrl)
                const pokemonData = await response.json()
                setData(pokemonData)
                console.log("Fetched pokemon data")
                const { name, stats, types, moves, sprites, id } = pokemonData
                const moveObjects = moves.map(m => ({ move: m.move }))
                cache[selectedPokemon] = { name, stats, types, moves: moveObjects, sprites, id }
                localStorage.setItem("pokedex", JSON.stringify(cache))
                setNotFound(false)

            } catch (err) {
                setNotFound(true)
            } finally {
                setLoading(false)
            }

        }
        fetchPokemonData()

        // if we fetch from the API, make sure to save the information to the cache for the next time


    }, [selectedPokemon])

    if (loading || !data) {
        return (
            <div>
                <h4>Loading...</h4>
            </div>
        )
    }
    if (notFound) {
        return (
            <div>
                <h4>NotFound.</h4>
            </div>
        )
    }

    return (
        <div className="poke-card">
            {skill && (<Modal handleCloseModal={() => { setSkill(null) }}>
                <div>
                    <h6>Name</h6>
                    <h2 className="skill-name">{skill.name.replaceAll("-", " ")}</h2>
                </div>
                <div>
                    <h6>Description</h6>
                    <p>{skill.description}</p>
                </div>
            </Modal>)}

            <div>
                <h4>#{id || getFullPokedexNumber(selectedPokemon)}</h4>
                <h2>{name}</h2>
            </div>
            <div className="type-container">
                {types.map((typeObj, typeIndex) => {
                    return (
                        <TypeCard key={typeIndex} type={typeObj?.type?.name} />
                    )
                })}
            </div>
            <img className="default-img" src={`/pokemon/${getFullPokedexNumber(selectedPokemon)}.png`} alt={`${name}-large-img`} onError={
                (e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = sprites.front_default;
                }} />
            <div className="img-container">
                {imgList.map((img, imgIndex) => {
                    return (
                        <img key={imgIndex} src={sprites[img]} alt={`${name}-${img}`} />
                    )
                })}
            </div>
            <h3>Stats</h3>
            <div className="stats-card">
                {stats.map((statObj, statIndex) => {
                    return (
                        <div key={statIndex} className="stat-item">
                            <p>{statObj?.stat?.name.replaceAll("-", " ")}</p>
                            <p>{statObj?.base_stat}</p>
                        </div>
                    )
                })}
            </div>
            <h3>Moves</h3>
            <div className="pokemon-move-grid">
                {
                    moves.sort((a, b) => a.move.name.localeCompare(b.move.name))
                        .map((moveObj, moveIndex) => {
                            return (
                                <button className="pokemon-move" key={moveIndex} onClick={() => { fetchMoveData(moveObj?.move?.name, moveObj?.move?.url) }}>
                                    <p>{moveObj?.move?.name.replaceAll("-", " ")}</p>
                                </button>
                            )
                        })
                }
            </div>
        </div>
    )
}