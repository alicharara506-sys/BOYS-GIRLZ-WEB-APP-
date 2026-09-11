import {createContext,useContext,useEffect,useReducer,useState,type ReactNode} from 'react'
import {products,type Product} from '../data/products'
import {calculateTotals,initialState,restoreStore,storeReducer,type Action,type StoreState} from './storeCore'
interface Store extends StoreState{dispatch:React.Dispatch<Action>;cartOpen:boolean;setCartOpen:(v:boolean)=>void;notice:string;notify:(s:string)=>void;add:(p:Product,size?:string,color?:string,quantity?:number,element?:HTMLElement)=>void;toggleWish:(id:string)=>void;count:number;totals:ReturnType<typeof calculateTotals>}
const StoreContext=createContext<Store|null>(null)
export function StoreProvider({children}:{children:ReactNode}){
 const [state,dispatch]=useReducer(storeReducer,initialState,()=>{try{return restoreStore(localStorage.getItem('boys-girlz:v1'),products)}catch{return initialState}})
 const [cartOpen,setCartOpen]=useState(false);const [notice,notify]=useState('')
 useEffect(()=>{try{localStorage.setItem('boys-girlz:v1',JSON.stringify(state))}catch{/* Local shopping still works without storage. */}},[state])
 useEffect(()=>{if(!notice)return;const id=window.setTimeout(()=>notify(''),3400);return()=>clearTimeout(id)},[notice])
 const add=(p:Product,size=p.sizes[0],color=p.colors[0],quantity=1,element?:HTMLElement)=>{if(!p.sizes.includes(size)||!p.colors.includes(color))return;dispatch({type:'ADD',item:{productId:p.id,size,color,quantity}});notify(`${p.name} added to your bag`);if(element)window.dispatchEvent(new CustomEvent('fly-to-bag',{detail:{rect:element.getBoundingClientRect(),image:p.image}}))}
 const toggleWish=(id:string)=>{dispatch({type:'WISH',id});notify(state.wishlist.includes(id)?'Removed from your wishlist':'A little favorite, saved for later')}
 const totals=calculateTotals(state.cart,new Map(products.map(p=>[p.id,p.price])),state.promo)
 return <StoreContext.Provider value={{...state,dispatch,cartOpen,setCartOpen,notice,notify,add,toggleWish,totals,count:state.cart.reduce((n,i)=>n+i.quantity,0)}}>{children}</StoreContext.Provider>
}
export function useStore(){const value=useContext(StoreContext);if(!value)throw new Error('StoreProvider is required');return value}
